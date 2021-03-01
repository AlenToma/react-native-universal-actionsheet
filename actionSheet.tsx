import React, { useContext, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { ViewStyle, StyleProp } from 'react-native';
var currentActionSheetId = "";
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
  const [currentValue, setCurrentValue] = useState(undefined as React.ReactNode | undefined);


  const [appcontextValue] = useState({
    show: async (value: React.ReactNode, id: string) => {
      currentActionSheetId = id;
      appcontextValue.clear("");
      await setCurrentValue(value);
    },
    clear: (id: string) => {
      if (currentActionSheetId == id) {
        setCurrentValue(undefined);
        currentActionSheetId = "";
      }
      appcontextValue.component.forEach((x) => {
        if (x.id != currentActionSheetId)
          x.event(false)
      });
    },
    component: [] as { id: string; event: (v: boolean) => void }[],
    registerComponent: (id: string, component: (v: boolean) => void) => {
      appcontextValue.component.push({ id: id, event: component });
    },
    unregisterComponent: (id: string) => {
      appcontextValue.component = appcontextValue.component.filter(x => x.id != id);
      if (currentActionSheetId === id) {
        currentActionSheetId = ""
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

const transitions = 500;
export const ActionSheet = ({
  children,
  transitionSpeed,
  onClose,
  size,
  visible,
  position,
  style,
  enableCloseIndicator,
}: {
  enableCloseIndicator?: boolean;
  children?: React.ReactNode;
  onClose: () => void;
  size?: number;
  transitionSpeed?: number;
  visible: boolean;
  position?: 'Bottom' | 'Top' | 'Left';
  style?: StyleProp<ViewStyle>;
}) => {
  const [fadeAnim] = useState(new Animated.Value(1));
  const [isVisible, setIsvisible] = useState(visible == true);
  const [id, setId] = useState(new Date().getUTCMilliseconds().toString());
  const actionSheetProviderContext = useContext(ActionSheetProviderContext);

  useEffect(() => {
    var generatedId = id;
    while (
      actionSheetProviderContext.component.find((x) => x.id == generatedId)
    ) {
      generatedId = generatedId + '1';
    }
    setId(generatedId);
    actionSheetProviderContext.registerComponent(generatedId, setIsvisible);
    return () => {
      actionSheetProviderContext.unregisterComponent(generatedId);
    };
  }, []);

  const show = async () => {
    await setIsvisible(true);
    if (position !== 'Left') {
      Animated.timing(fadeAnim, {
        toValue: Math.min(Dimensions.get('window').height, size ?? 300),
        duration: transitionSpeed,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: Math.min(Dimensions.get('window').width, size ?? (Dimensions.get('window').width / 2)),
        duration: transitionSpeed,
        useNativeDriver: false,
      }).start();
    }
    actionSheetProviderContext.show(getItem(), id);
  };

  const hide = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: transitionSpeed,
      useNativeDriver: false,
    }).start();
    setTimeout(() => {
      setIsvisible(false);
      actionSheetProviderContext.clear(id);
    }, (transitionSpeed ?? transitions) + 20);
  };
  useEffect(() => {
    if (!transitionSpeed) transitionSpeed = transitions;
    if (isVisible) show();
  }, []);

  useEffect(() => {
    if (visible) show();
    else hide();
  }, [visible]);

  useEffect(() => {
    if (visible) show();
  });
  
  const getItem = () => {
    return (
      <View style={styles.container}>
        <Text style={styles.closer} onPress={onClose} />
        <Animated.View
          style={[
            styles.actionSheet,
            style,
            {
              height: position !== 'Left' ? fadeAnim : style?.height ?? '100%',
              width: position === 'Left' ? fadeAnim : style?.width ?? '100%',
              bottom:
                !position || position == 'Bottom'
                  ? 0
                  : style?.bottom ?? undefined,
              top: position === 'Top' ? 0 : style?.top ?? undefined,
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
          {children ? children : null}
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
  },
});