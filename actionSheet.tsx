import React, { useContext, useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    Animated
} from 'react-native';
import { ViewStyle, StyleProp } from 'react-native';

const transitions = 500;
const ActionSheet = ({ children,
    transitionSpeed,
    onClose,
    height,
    visible,
    position,
    style,
    enableCloseIndicator
}:
    {
        enableCloseIndicator?: boolean,
        children?: React.ReactNode,
        onClose: () => void,
        height?: number,
        transitionSpeed?: number,
        visible: boolean,
        position?: "Bottom" | "Top",
        style?: StyleProp<ViewStyle>
    }) => {

    const [fadeAnim] = useState(new Animated.Value(1))
    const [isVisible, setIsvisible] = useState(visible);

    const show = async () => {

        await setIsvisible(true);
        Animated.timing(fadeAnim, {
            toValue: Math.min(Dimensions.get("window").height, height ?? 300),
            duration: transitionSpeed,
            useNativeDriver: false
        }).start();
    }

    const hide = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: transitionSpeed,
            useNativeDriver: false
        }).start();

        setTimeout(() => {
            setIsvisible(false);
        }, (transitionSpeed ?? transitions) + 20)
    }
    useEffect(() => {
        if (!transitionSpeed)
            transitionSpeed = transitions;
        if (isVisible)
            show();
    }, [])

    useEffect(() => {
        if (visible)
            show();
        else hide();
    }, [visible])

    if (!isVisible)
        return null;
    return (
        <View style={styles.container}>
            <Text style={styles.closer} onPress={onClose} />
            <Animated.View style={[styles.actionSheet, style, { height: fadeAnim, bottom: !position || position == "Bottom" ? 0 : undefined, top: position === "Top" ? 0 : undefined }]}>
                {enableCloseIndicator === true ? (
                    <View
                        style={{
                            width: '100%',
                            alignItems: 'flex-end',
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                        }}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={{ color: "red", fontSize: 20 }} >X</Text>
                        </TouchableOpacity>
                    </View>) : null}
                {children ? children : null}
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        height: "100%",
        width: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 100000
    },

    closer: {
        zIndex: 100,
        flex: 1,
        position: "absolute",
        top: 0,
        left: 0,
        backgroundColor: "#000",
        height: "100%",
        width: "100%",
        opacity: 0.5,

    },

    actionSheet: {
        width: "100%",
        maxHeight: "80%",
        position: "absolute",
        backgroundColor: "#fff",
        bottom: 0,
        zIndex: 101,
        padding: 10
    }
})

export default ActionSheet;