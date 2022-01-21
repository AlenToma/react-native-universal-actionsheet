import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import {
  ViewStyle,
  StyleProp,
  PanResponder,
  PanResponderInstance,
} from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const ActionSheetProviderContext = React.createContext(
  {} as {
    show: (item: React.ReactNode, id: string) => void;
    clear: (id: string) => void;
    component: { id: string; event: (v: boolean) => void }[];
    registerComponent: (id: string, value: (v: boolean) => void) => void;
    unregisterComponent: (id: string) => void;
  }
);
export const ActionSheetProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentValue, setCurrentValue] = useState(
    undefined as React.ReactNode | undefined
  );
  const currentActionSheetId = useRef('');

  const [appcontextValue] = useState({
    show: async (value: React.ReactNode, id: string) => {
      if (id == '') return;
      currentActionSheetId.current = id;
      appcontextValue.clear('');
      await setCurrentValue(value);
    },
    clear: (id: string) => {
      if (currentActionSheetId.current == id) {
        setCurrentValue(undefined);
        currentActionSheetId.current = '';
      }
      appcontextValue.component.forEach((x) => {
        if (x.id != currentActionSheetId.current) x.event(false);
      });
    },
    component: [] as { id: string; event: (v: boolean) => void }[],
    registerComponent: (id: string, component: (v: boolean) => void) => {
      if (appcontextValue.component.find((x) => x.id == id) === undefined)
        appcontextValue.component.push({ id: id, event: component });
      else appcontextValue.component.find((x) => x.id == id).event = component;
    },
    unregisterComponent: (id: string) => {
      appcontextValue.component = appcontextValue.component.filter(
        (x) => x.id != id
      );
      if (currentActionSheetId.current == id) {
        console.log('Clearing ActionSheet', id);
        currentActionSheetId.current = '';
        setCurrentValue(undefined);
      }
    },
  });

  return (
    <ActionSheetProviderContext.Provider value={appcontextValue}>
      {children}
      {currentValue ? currentValue : null}
    </ActionSheetProviderContext.Provider>
  );
};

const transitions = 100;
export const ActionSheet = ({
  children,
  transitionSpeed,
  onClose,
  size,
  visible,
  position,
  style,
  enableCloseIndicator,
  handlerStyle,
}: {
  enableCloseIndicator?: boolean;
  children?: React.ReactNode;
  onClose: () => void;
  size?: number;
  transitionSpeed?: number;
  visible: boolean;
  position?: 'Bottom' | 'Top' | 'Left';
  style?: StyleProp<ViewStyle>;
  handlerStyle?: StyleProp<ViewStyle>;
}) => {
  const [fadeAnim] = useState(new Animated.Value(1));
  const [isVisible, setIsvisible] = useState(visible == true);
  const id = useRef(uuidv4())
  const disabled = useRef(false);
  const actionSheetProviderContext = useContext(ActionSheetProviderContext);
  const working = React.useRef(false);
  const timer = React.useRef(undefined as any);
  const currentValue = React.useRef(0);
  const panResponder = React.useRef(
    undefined as PanResponderInstance | undefined
  );

  useEffect(() => {
    var dx = 0;
    var dy = 0;
    panResponder.current = PanResponder.create({
      onPanResponderEnd: (e, gesture) => {},
      onPanResponderRelease: (e, g) => {
        dx = dy = 0;
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          const sh = size ?? 300;
          var h = Math.min(Dimensions.get('window').height, sh) * 0.95;
          var w = Math.min(
            Dimensions.get('window').width,
            size ?? Dimensions.get('window').width / 2
          );
          var close = false;

          if (
            currentValue.current <= h &&
            (!position || position === 'Bottom')
          ) {
            close = true;
          } else if (position === 'Top' && currentValue.current <= h)
            close = true;
          else if (position === 'Left' && w * 0.9 > currentValue.current)
            close = true;
          if (close) {
            onClose();
            return false;
          } else return true;
        }, 10);
      },
      onPanResponderGrant: (evt, g) => {
        dx = Math.abs(g.dx - evt.nativeEvent.pageX);
        dy = Math.abs(g.dy - evt.nativeEvent.pageY);
        console.log(dy);
      },
      onStartShouldSetPanResponder: (evt, gesture) => {
        return true;
      },
      onPanResponderMove: (event, gestureState) => {
        if (working.current || disabled.current) return;

        if (position == 'Bottom' || !position) {
          if (
            Dimensions.get('window').height - gestureState.dy - dy >
            (size ?? Dimensions.get('window').height / 2)
          ) {
            fadeAnim.setValue(size ?? Dimensions.get('window').height / 2);
            return;
          }
          fadeAnim.setValue(
            Dimensions.get('window').height - gestureState.dy - dy
          );
        } else if (position === 'Top') {
          if (
            gestureState.dy + dy >
            (size ?? Dimensions.get('window').height / 2)
          ) {
            fadeAnim.setValue(size ?? Dimensions.get('window').height / 2);
            return;
          }
          fadeAnim.setValue(gestureState.dy + dy);
        } else if (position === 'Left') {
          if (
            gestureState.dx + dx >
            (size ?? Dimensions.get('window').width / 2)
          ) {
            fadeAnim.setValue(size ?? Dimensions.get('window').width / 2);
            return;
          }
          fadeAnim.setValue(gestureState.dx + dx);
        }
      },
    });
  }, [position, visible]);

  const dimChanged = ({ window, screen }: any) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (visible) {
        show();
      }
    }, 200);
  };

  useEffect(() => {
    const listenerId = fadeAnim.addListener(
      (v) => (currentValue.current = v.value)
    );

    actionSheetProviderContext.registerComponent(id.current, setIsvisible);
    if (!transitionSpeed) transitionSpeed = transitions;
    if (isVisible) show();
    return () => {
      var uId = id.current;
      id.current = '';
      Dimensions.removeEventListener('change', dimChanged);
      actionSheetProviderContext.unregisterComponent(uId);
      fadeAnim.removeListener(listenerId);
    };
  }, []);

  const show = async (updateOnly?: boolean) => {
    working.current = true;
    if (!updateOnly) {
      await setIsvisible(true);
      if (position !== 'Left') {
        Animated.timing(fadeAnim, {
          toValue: Math.min(Dimensions.get('window').height, size ?? 300),
          duration: transitionSpeed,
          useNativeDriver: false,
        }).start();
      } else {
        Animated.timing(fadeAnim, {
          toValue: Math.min(
            Dimensions.get('window').width,
            size ?? Dimensions.get('window').width / 2
          ),
          duration: transitionSpeed,
          useNativeDriver: false,
        }).start();
      }
    }
    actionSheetProviderContext.show(getItem(), id.current);
    working.current = false;
  };

  const hide = () => {
    working.current = true;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: transitionSpeed,
      useNativeDriver: false,
    }).start(() => {
      setIsvisible(false);
      actionSheetProviderContext.clear(id.current);
      working.current = false;
    });
  };

  useEffect(() => {
    if (visible) show();
    else hide();
  }, [visible]);

  useEffect(() => {
    Dimensions.removeEventListener('change', dimChanged);
    Dimensions.addEventListener('change', dimChanged);
    if (
      visible &&
      actionSheetProviderContext.component.find((x) => x.id === id.current) &&
      id.current != ''
    )
      show(true);
  });

  const getItem = () => {
    return (
      <View style={styles.container}>
        <Text style={styles.closer} onPress={onClose} />

        <Animated.View
          {...panResponder.current?.panHandlers}
          style={[
            styles.actionSheet,
            style,
            {
              alignItems: position == 'Left' ? 'flex-start' : 'center',
              height:
                position !== 'Left'
                  ? fadeAnim
                  : (style as any)?.height ?? '100%',
              width:
                position === 'Left'
                  ? fadeAnim
                  : (style as any)?.width ?? '100%',

              bottom:
                !position || position == 'Bottom'
                  ? 0
                  : (style as any)?.bottom ?? undefined,
              top: position === 'Top' ? 0 : (style as any)?.top ?? undefined,
            },
          ]}>
          {enableCloseIndicator === true ? (
            <View
              style={{
                width: '100%',
                alignItems: 'flex-end',
                flexDirection: 'row',
                justifyContent: 'flex-end',
              }}>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: 'red', fontSize: 20 }}>X</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <View
            style={{
              alignItems: 'center',
              maxHeight: position != 'Left' ? '90%' : '100%',
              maxWidth: '100%',
            }}>
            {!position || position === 'Bottom' ? (
              <View
                onTouchStart={() => (disabled.current = false)}
                style={[styles.handler, handlerStyle]}
              />
            ) : null}
            <View
              onTouchStart={() => (disabled.current = true)}
              onTouchEnd={() => (disabled.current = false)}
              style={{
                width: '100%',
                height: '100%',
                minWidth:
                  position !== 'Left'
                    ? Dimensions.get('window').width
                    : (size ?? Dimensions.get('window').width / 2) - 40,
                minHeight: position !== 'Left' ? '92%' : '100%',
              }}>
              {children ? children : null}
            </View>
          </View>
          {position === 'Top' ? (
            <View
              onTouchStart={() => (disabled.current = false)}
              style={[
                styles.handler,
                handlerStyle,
                { position: 'absolute', bottom: 0 },
              ]}
            />
          ) : null}

          {position === 'Left' ? (
            <View
              onTouchStart={() => (disabled.current = false)}
              style={[
                styles.handler,
                handlerStyle,
                {
                  position: 'absolute',
                  right: 0,
                  top: Dimensions.get('window').height / 2,
                  transform: [{ rotate: '90deg' }],
                },
              ]}
            />
          ) : null}
        </Animated.View>
      </View>
    );
  };

  return null;
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 100000,
  },

  handler: {
    width: 38,
    height: 10,
    padding: 0,
    backgroundColor: 'gray',
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5,
  },

  closer: {
    zIndex: 100,
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#000',
    height: '100%',
    width: '100%',
    opacity: 0.5,
  },

  actionSheet: {
    width: '100%',
    position: 'absolute',
    backgroundColor: '#fff',
    bottom: 0,
    zIndex: 101,
    padding: 0,
    overflow: 'hidden',
    paddingTop: 0,
    alignItems: 'center',
  },
});
