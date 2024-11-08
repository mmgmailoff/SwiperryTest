import React, {useEffect} from 'react';
import {Image} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import styles from '../styles';

interface RespondProps {
  isSuccess: boolean | null;
}

const Respond: React.FC<RespondProps> = ({isSuccess}) => {
  const scaleAnim = useSharedValue(0);

  useEffect(() => {
    if (isSuccess !== null) {
      scaleAnim.value = withDelay(
        200,
        withSpring(1, {
          damping: 10,
          stiffness: 90,
        }),
      );
    }
  }, [isSuccess]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scaleAnim.value}],
    };
  });

  return (
    <Animated.View style={[styles.respond, animatedStyle]}>
      <Image
        style={{width: 90, height: 90}}
        source={
          isSuccess
            ? require('../assets/images/success.png')
            : isSuccess === false
            ? require('../assets/images/failure.png')
            : undefined
        }
      />
    </Animated.View>
  );
};

export default Respond;
