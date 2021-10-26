# react-native-universal-actionsheet
 Cross platform ActionSheet. This component implements a custom ActionSheet and provides the same way to drawing it on the different platforms(iOS and Android, Web, Windows). It dose not use any native code. So there is no aditionalal implementation on different platforms. Install the component and enjoy.
 
 ## Working Example
 [react-native-universal-actionsheet](https://snack.expo.io/@alentoma/react-native-universal-actionsheet)
 
 ## Android and IOS
 <div>
 <img src="https://github.com/AlenToma/react-native-universal-actionsheet/blob/main/images/android.PNG" width="200"/>
 
 
 <img src="https://github.com/AlenToma/react-native-universal-actionsheet/blob/main/images/iphone.PNG" width="200"/>
 </div>
 
 
## Installations

`npm i react-native-universal-actionsheet`

## Additional Installations

### Android
No Additional Installations

### Iphone
No Additional Installations

### Web
No Additional Installations

## Usage

```js
import { ActionSheet, ActionSheetProvider } from 'react-native-universal-actionsheet';

const testComponent =()=> {
        const [visible, setVisible] = useState(false)

    return (
        <>
            <TouchableOpacity onPress={()=> setVisible(true)}>
                <Text>Show ActionSheet</Text>
            </TouchableOpacity>
            <ActionSheet position="Bottom" size={250} visible={visible} onClose={()=> setVisible(false)}>
             // add your components here
            </ActionSheet>
        </>
    )
}

const App=()=> {

    return (<ActionSheetProvider>
            <testComponent />
          </ActionSheetProvider>)
}




```

## Properties
* `position`: "Top" | "Bottom" | "Left" (Default "Bottom")
* `onClose`: ()=> void, when the actiosheet trigger close event.
* `style`: style the ActionSheet eg `{ backgroundColor:"#fff", opacity:0.8}`
* `visible`: true | false
* `size`: the height or width of ActionSheet depending on the position(Default 300) 
* `transitionSpeed`: the slide up or down speed of the StyleSheet (Default 500)
* `enableCloseIndicator`: true | false (Default false)
