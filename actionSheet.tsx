import React, { useContext, useState, useEffect } from 'react';
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

var currentActionSheetId = '';
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

  const [appcontextValue] = useState({
    show: async (value: React.ReactNode, id: string) => {
      currentActionSheetId = id;
      appcontextValue.clear('');
      await setCurrentValue(value);
    },
    clear: (id: string) => {
      if (currentActionSheetId == id) {
        setCurrentValue(undefined);
        currentActionSheetId = '';
      }
      appcontextValue.component.forEach((x) => {
        if (x.id != currentActionSheetId) x.event(false);
      });
    },
    component: [] as { id: string; event: (v: boolean) => void }[],
    registerComponent: (id: string, component: (v: boolean) => void) => {
      appcontextValue.component.push({ id: id, event: component });
    },
    unregisterComponent: (id: string) => {
      appcontextValue.component = appcontextValue.component.filter(
        (x) => x.id != id
      );
      if (currentActionSheetId === id) {
        currentActionSheetId = '';
        setCurrentValue(undefined);
      }
    },
  });

  return (
    <ActionSheetProviderContext.Provider value={appcontextValue}>
      {children}
      <>{currentValue ? currentValue : null}</>
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
  handlerStyle
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
  const [id, setId] = useState(new Date().getUTCMilliseconds().toString());
  const actionSheetProviderContext = useContext(ActionSheetProviderContext);
  const working = React.useRef(false);
  const timer = React.useRef(undefined as any);
  const currentValue = React.useRef(0);
  const panResponder = React.useRef(
    undefined as PanResponderInstance | undefined
  );

  useEffect(() => {
    panResponder.current = PanResponder.create({
      onPanResponderEnd: (e, gesture) => {},
      onPanResponderRelease: (e, g) => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          var h = Math.min(Dimensions.get('window').height, size ?? 300);
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
          else if (position === 'Left' && w / 2 > currentValue.current)
            close = true;
          if (close) {
            onClose();
            return false;
          } else return true;
        }, 10);
      },
      onStartShouldSetPanResponder: (e, gesture) => {
        return true;
      },
      onPanResponderMove: (event, gestureState) => {
        if (working.current) return;
        if (position == 'Bottom' || !position)
          fadeAnim.setValue(
            Dimensions.get('window').height - gestureState.moveY + 20
          );
        else if (position === 'Top') {
          fadeAnim.setValue(gestureState.moveY + 20);
        } else if (position === 'Left')
          fadeAnim.setValue(gestureState.moveX + 20);
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
    var generatedId = id;
    while (
      actionSheetProviderContext.component.find((x) => x.id == generatedId)
    ) {
      generatedId = generatedId + '1';
    }
    setId(generatedId);
    actionSheetProviderContext.registerComponent(generatedId, setIsvisible);
    if (!transitionSpeed) transitionSpeed = transitions;
    if (isVisible) show();
    return () => {
      Dimensions.removeEventListener('change', dimChanged);
      actionSheetProviderContext.unregisterComponent(generatedId);
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
    actionSheetProviderContext.show(getItem(), id);
    working.current = false;
  };

  const hide = () => {
    working.current = true;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: transitionSpeed,
      useNativeDriver: false,
    }).start(()=> {
      setIsvisible(false);
      actionSheetProviderContext.clear(id);
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
    if (visible) show(true);
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
              maxHeight: '90%',
              maxWidth: '100%',
            }}>
            {!position || position === 'Bottom' ? (
              <View style={[styles.handler, handlerStyle]} />
            ) : null}
            <View
              style={{
                width: '100%',
                height: '100%',
              }}>
              {children ? children : null}
            </View>
            {position === 'Top' ? <View style={[styles.handler, handlerStyle]} /> : null}
          </View>
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
    padding: 10,
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
    padding: 10,
    overflow: 'hidden',
    paddingTop: 5,
  },
});