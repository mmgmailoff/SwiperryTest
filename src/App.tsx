// App.tsx

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  SafeAreaView,
  Text,
  View,
  Image,
  TouchableWithoutFeedback,
  LayoutChangeEvent,
} from 'react-native';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import DeviceInfo from 'react-native-device-info';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

import IconCheckmark from './assets/svg/checkmark-ic.svg';
import Respond from './components/Respond'; // Ensure this component is correctly defined
import styles from './styles'; // Ensure your styles are correctly defined

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const SCALE_UP = 1.03;
const SCALE_DOWN = 0.94;
const OPACITY = 0.4;
const GESTURE_VERTICAL = 60;
const GESTURE_HORIZONTAL = 30;

enum Actions {
  Reload = 'RELOAD',
  Correct = 'CORRECT',
  Wrong = 'WRONG',
  Skip = 'SKIP',
}

enum GestureDirection {
  None,
  Horizontal,
  Vertical,
}

const App: React.FC = () => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [swipeAction, setSwipeAction] = useState<string | null>(null);
  const [swipeResponseAction, setSwipeResponseAction] = useState<string | null>(
    null,
  );
  const originalData = useRef(null);

  // Shared values for animations
  const scaleFirst = useSharedValue(1);
  const scaleSecond = useSharedValue(1);
  const opacityFirst = useSharedValue(1);
  const opacitySecond = useSharedValue(1);

  const iconTranslateY = useSharedValue(0);
  const iconOpacity = useSharedValue(0); // IconCheckmark is hidden by default
  const iconAtTop = useSharedValue(false); // Tracks whether the IconCheckmark is at the top

  // Shared values for horizontal icons (iconCircle)
  const leftIconTranslateX = useSharedValue(-35);
  const leftIconScale = useSharedValue(0.8);
  const rightIconTranslateX = useSharedValue(35);
  const rightIconScale = useSharedValue(0.8);

  // Shared values for iconCircle background colors
  const leftIconBackgroundProgress = useSharedValue(0);
  const rightIconBackgroundProgress = useSharedValue(0);

  // Shared values for image positions and heights
  const firstImageY = useSharedValue(0);
  const secondImageY = useSharedValue(0);
  const firstImageHeight = useSharedValue(0);
  const secondImageHeight = useSharedValue(0);
  const initialIconPositionY = useSharedValue(0);

  // Shared values for accumulated translation
  const translationY = useSharedValue(0);

  // Shared value to track the gesture direction
  const gestureDirection = useSharedValue<GestureDirection>(
    GestureDirection.None,
  );

  // Shared value to track if horizontal swipe is active
  const isHorizontalSwipeActive = useSharedValue(false);

  // Shared value for gradient opacity
  const gradientOpacity = useSharedValue(0);

  // Animated styles
  const firstImageStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scaleFirst.value}],
      opacity: opacityFirst.value,
    };
  });

  const secondImageStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scaleSecond.value}],
      opacity: opacitySecond.value,
    };
  });

  const iconTranslateYStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateY: iconTranslateY.value}, {translateX: -22}],
      opacity: iconOpacity.value,
    };
  });

  const leftIconStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      leftIconBackgroundProgress.value,
      [0, 1],
      ['white', '#6F8FAD'],
    );
    return {
      transform: [
        {translateX: leftIconTranslateX.value},
        {scale: leftIconScale.value},
      ],
      backgroundColor,
    };
  });

  const rightIconStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      rightIconBackgroundProgress.value,
      [0, 1],
      ['white', '#F98600'],
    );
    return {
      transform: [
        {translateX: rightIconTranslateX.value},
        {scale: rightIconScale.value},
      ],
      backgroundColor,
    };
  });

  const gradientStyle = useAnimatedStyle(() => {
    return {
      opacity: gradientOpacity.value,
    };
  });

  const animateIcon = (
    translateValue: Animated.SharedValue<number>,
    scaleValue: Animated.SharedValue<number>,
    toTranslate: number,
    toScale: number,
  ) => {
    'worklet';
    translateValue.value = withTiming(toTranslate, {duration: 200});
    scaleValue.value = withTiming(toScale, {duration: 200});
  };

  const hideHorizontalAction = () => {
    'worklet';
    animateIcon(rightIconTranslateX, rightIconScale, 75, 0.8);
    animateIcon(leftIconTranslateX, leftIconScale, -75, 0.8);
    leftIconBackgroundProgress.value = withTiming(0, {duration: 200});
    rightIconBackgroundProgress.value = withTiming(0, {duration: 200});
  };

  const showHorizontalAction = () => {
    'worklet';
    animateIcon(rightIconTranslateX, rightIconScale, 35, 0.8);
    animateIcon(leftIconTranslateX, leftIconScale, -35, 0.8);
    leftIconBackgroundProgress.value = withTiming(0, {duration: 200});
    rightIconBackgroundProgress.value = withTiming(0, {duration: 200});
  };

  const resetStage = () => {
    setSelectedAnswer(null);
    setSwipeAction(null);
    setSwipeResponseAction(null);
    scaleFirst.value = 1;
    scaleSecond.value = 1;
    opacityFirst.value = 1;
    opacitySecond.value = 1;
    iconOpacity.value = 0; // Hide IconCheckmark
    iconAtTop.value = false;
    isHorizontalSwipeActive.value = false;
    leftIconBackgroundProgress.value = 0;
    rightIconBackgroundProgress.value = 0;
    gradientOpacity.value = 0; // Reset gradient opacity
    showHorizontalAction(); // Show horizontal icons again
  };

  function shuffleArray(array: any) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  const handleGetStage = useCallback(
    (id?: string) => {
      fetch('https://swipery.io/stage', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `${id || deviceId}`,
        },
      })
        .then(response => {
          return response.json();
        })
        .then(data => {
          originalData.current = data;

          const resultArray = [
            {
              image: data.stage.correctLearningUnit.image,
              action: Actions.Correct,
            },
            {
              image: data.stage.wrongLearningUnit.image,
              action: Actions.Wrong,
            },
          ];
          const shuffledArray = shuffleArray([...resultArray]);
          // Reset opacities to 0 before setting new data
          opacityFirst.value = 0;
          opacitySecond.value = 0;

          setData(shuffledArray);
        })
        .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
        });
    },
    [deviceId, opacityFirst, opacitySecond],
  );

  const handlePostStage = useCallback(() => {
    const tempSwipeAction = swipeAction;
    setSwipeAction(null);
    const body = JSON.stringify({
      stageResult: {...originalData?.current?.stage, action: tempSwipeAction},
    });
    console.log('deviceId', deviceId);
    fetch('https://swipery.io/stage-result', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `${deviceId}`,
      },
      body: body,
    })
      .then(response => {
        if (!response.ok) {
          console.error('Network response was not ok');
        }
        return response.json();
      })
      .then(() => {
        setSwipeResponseAction(tempSwipeAction);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }, [deviceId, swipeAction]);

  useEffect(() => {
    const fetchDeviceId = async () => {
      try {
        const id = await DeviceInfo.getUniqueId();
        setDeviceId(id);
        handleGetStage(id);
      } catch (error) {
        console.error('Error', error);
      }
    };

    fetchDeviceId();
  }, [handleGetStage]);

  useEffect(() => {
    if (swipeAction) {
      handlePostStage();
    }
  }, [handlePostStage, swipeAction]);

  useEffect(() => {
    if (
      swipeResponseAction === Actions.Reload ||
      swipeResponseAction === Actions.Skip
    ) {
      setTimeout(() => {
        setSwipeResponseAction(null);
      }, 1000);
      handleGetStage();
    }

    if (
      swipeResponseAction === Actions.Wrong ||
      swipeResponseAction === Actions.Correct
    ) {
      setTimeout(() => {
        handleGetStage();
        resetStage();
      }, 1000);
    }
  }, [swipeResponseAction, handleGetStage]);

  // Fade-in effect when data changes
  useEffect(() => {
    if (data) {
      // Animate opacities to 1 for fade-in effect
      opacityFirst.value = withTiming(1, {duration: 500});
      opacitySecond.value = withTiming(1, {duration: 500});
    }
  }, [data, opacityFirst, opacitySecond]);

  // Animate gradient opacity when selectedAnswer changes
  useEffect(() => {
    if (selectedAnswer !== null) {
      gradientOpacity.value = withTiming(1, {duration: 500});
    }
  }, [selectedAnswer, gradientOpacity]);

  // Gesture handling
  const panGesture = Gesture.Pan()
    .onStart(event => {
      'worklet';
      if (selectedAnswer === null) {
        const touchY = event.y;

        let initialIconY;
        if (
          touchY >= firstImageY.value &&
          touchY <= firstImageY.value + firstImageHeight.value
        ) {
          // Touched on top image
          initialIconY = firstImageY.value + firstImageHeight.value / 2 - 45;
          iconAtTop.value = true;
        } else if (
          touchY >= secondImageY.value &&
          touchY <= secondImageY.value + secondImageHeight.value
        ) {
          // Touched on bottom image
          initialIconY = secondImageY.value + secondImageHeight.value / 2 - 45;
          iconAtTop.value = false;
        } else {
          // Default position
          initialIconY = initialIconPositionY.value;
          iconAtTop.value = false;
        }

        iconTranslateY.value = initialIconY;
        iconOpacity.value = 1; // Show IconCheckmark

        // Reset gesture direction
        gestureDirection.value = GestureDirection.None;
      }
    })
    .onUpdate(event => {
      'worklet';
      if (selectedAnswer === null) {
        translationY.value = event.translationY;

        if (gestureDirection.value === GestureDirection.None) {
          const absTranslationX = Math.abs(event.translationX);
          const absTranslationY = Math.abs(event.translationY);

          if (absTranslationX > 10 || absTranslationY > 10) {
            if (absTranslationX > absTranslationY) {
              gestureDirection.value = GestureDirection.Horizontal;
            } else {
              gestureDirection.value = GestureDirection.Vertical;
            }
          }
        }

        if (gestureDirection.value === GestureDirection.Horizontal) {
          // Horizontal swipe detected
          isHorizontalSwipeActive.value = true;

          // Disable vertical animations
          scaleFirst.value = 1;
          opacityFirst.value = 1;
          scaleSecond.value = 1;
          opacitySecond.value = 1;

          // Handle horizontal swipe animations
          if (event.translationX < 0) {
            // Swiping right
            // Animate right iconCircle
            rightIconTranslateX.value = withTiming(-10, {duration: 200});
            rightIconScale.value = withTiming(1.1, {duration: 200});
            rightIconBackgroundProgress.value = withTiming(1, {duration: 200});
            // Reset left iconCircle
            leftIconTranslateX.value = withTiming(-35, {duration: 200});
            leftIconScale.value = withTiming(0.8, {duration: 200});
            leftIconBackgroundProgress.value = withTiming(0, {duration: 200});
          } else {
            // Swiping left
            // Animate left iconCircle
            leftIconTranslateX.value = withTiming(10, {duration: 200});
            leftIconScale.value = withTiming(1.1, {duration: 200});
            leftIconBackgroundProgress.value = withTiming(1, {duration: 200});
            // Reset right iconCircle
            rightIconTranslateX.value = withTiming(35, {duration: 200});
            rightIconScale.value = withTiming(0.8, {duration: 200});
            rightIconBackgroundProgress.value = withTiming(0, {duration: 200});
          }
        } else if (gestureDirection.value === GestureDirection.Vertical) {
          // Vertical swipe detected
          isHorizontalSwipeActive.value = false;

          // Hide horizontal icons during vertical swipe
          hideHorizontalAction();

          if (event.translationY < 0) {
            // Swiping up
            const progress = Math.min(
              -event.translationY / GESTURE_VERTICAL,
              1,
            );

            // Update images scaling and opacity
            scaleFirst.value = 1 + (SCALE_UP - 1) * progress;
            opacityFirst.value = 1; // Active image opacity remains 1

            scaleSecond.value = 1 - (1 - SCALE_DOWN) * progress;
            opacitySecond.value = 1 - (1 - OPACITY) * progress; // Inactive image opacity decreases towards 0.4

            // Move IconCheckmark to top if threshold crossed
            if (event.translationY < -GESTURE_VERTICAL && !iconAtTop.value) {
              iconAtTop.value = true;
              const topY = firstImageY.value + firstImageHeight.value / 2 - 45;
              iconTranslateY.value = withTiming(topY, {duration: 200});
            }
          } else if (event.translationY > 0) {
            // Swiping down
            const progress = Math.min(event.translationY / GESTURE_VERTICAL, 1);

            // Update images scaling and opacity
            scaleSecond.value = 1 + (SCALE_UP - 1) * progress;
            opacitySecond.value = 1; // Active image opacity remains 1

            scaleFirst.value = 1 - (1 - SCALE_DOWN) * progress;
            opacityFirst.value = 1 - (1 - OPACITY) * progress; // Inactive image opacity decreases towards 0.4

            // Move IconCheckmark to bottom if threshold crossed
            if (event.translationY > GESTURE_VERTICAL && iconAtTop.value) {
              iconAtTop.value = false;
              const bottomY =
                secondImageY.value + secondImageHeight.value / 2 - 45;
              iconTranslateY.value = withTiming(bottomY, {duration: 200});
            }
          }
        } else {
          // Gesture direction not yet determined
          // Reset animations
          isHorizontalSwipeActive.value = false;

          // Reset vertical animations
          scaleFirst.value = 1;
          opacityFirst.value = 1;
          scaleSecond.value = 1;
          opacitySecond.value = 1;

          // Show horizontal icons if not swiping vertically
          showHorizontalAction();

          // Reset iconCircles backgrounds
          leftIconBackgroundProgress.value = withTiming(0, {duration: 200});
          rightIconBackgroundProgress.value = withTiming(0, {duration: 200});

          // Reset iconCircles to initial positions
          leftIconTranslateX.value = withTiming(-35, {duration: 200});
          leftIconScale.value = withTiming(0.8, {duration: 200});
          rightIconTranslateX.value = withTiming(35, {duration: 200});
          rightIconScale.value = withTiming(0.8, {duration: 200});
        }
      }
    })
    .onEnd(event => {
      'worklet';

      // Always hide IconCheckmark on untouch
      iconOpacity.value = withTiming(0, {duration: 200});

      if (data && selectedAnswer === null) {
        if (gestureDirection.value === GestureDirection.Horizontal) {
          // Horizontal swipe action
          if (event.translationX > GESTURE_HORIZONTAL) {
            // Swiped right
            runOnJS(setSwipeAction)(Actions.Skip);
          } else if (event.translationX < -GESTURE_HORIZONTAL) {
            // Swiped left
            runOnJS(setSwipeAction)(Actions.Reload);
          }

          // Reset horizontal swipe animations
          leftIconTranslateX.value = withTiming(-35, {duration: 200});
          leftIconScale.value = withTiming(0.8, {duration: 200});
          rightIconTranslateX.value = withTiming(35, {duration: 200});
          rightIconScale.value = withTiming(0.8, {duration: 200});

          // Reset iconCircles backgrounds
          leftIconBackgroundProgress.value = withTiming(0, {duration: 200});
          rightIconBackgroundProgress.value = withTiming(0, {duration: 200});
        } else if (gestureDirection.value === GestureDirection.Vertical) {
          // Vertical swipe action
          if (translationY.value < -GESTURE_VERTICAL) {
            // Swiped up beyond threshold
            // Hide IconCheckmark (already hidden), then set selectedAnswer
            runOnJS(setSelectedAnswer)(0);
            runOnJS(setSwipeAction)(data[0]?.action);

            // Finalize image scaling and opacity
            scaleFirst.value = withTiming(SCALE_UP, {duration: 200});
            opacityFirst.value = withTiming(1, {duration: 200});
            scaleSecond.value = withTiming(SCALE_DOWN, {duration: 200});
            opacitySecond.value = withTiming(OPACITY, {duration: 200});
          } else if (translationY.value > GESTURE_VERTICAL) {
            // Swiped down beyond threshold
            // Hide IconCheckmark (already hidden), then set selectedAnswer
            runOnJS(setSelectedAnswer)(1);
            runOnJS(setSwipeAction)(data[1]?.action);

            // Finalize image scaling and opacity
            scaleSecond.value = withTiming(SCALE_UP, {duration: 200});
            opacitySecond.value = withTiming(1, {duration: 200});
            scaleFirst.value = withTiming(SCALE_DOWN, {duration: 200});
            opacityFirst.value = withTiming(OPACITY, {duration: 200});
          } else {
            // Reset images
            scaleFirst.value = withTiming(1, {duration: 200});
            opacityFirst.value = withTiming(1, {duration: 200});
            scaleSecond.value = withTiming(1, {duration: 200});
            opacitySecond.value = withTiming(1, {duration: 200});
          }
        } else {
          // Gesture direction not determined or minimal movement
          // Reset images and animations
          scaleFirst.value = withTiming(1, {duration: 200});
          opacityFirst.value = withTiming(1, {duration: 200});
          scaleSecond.value = withTiming(1, {duration: 200});
          opacitySecond.value = withTiming(1, {duration: 200});
        }
      }

      // Reset flags
      isHorizontalSwipeActive.value = false;
      gestureDirection.value = GestureDirection.None;

      // Reset translation values
      translationY.value = 0;
    });

  // Layout handlers
  const onFirstImageLayout = (event: LayoutChangeEvent) => {
    const {y, height} = event.nativeEvent.layout;
    firstImageY.value = y;
    firstImageHeight.value = height;

    // Calculate initialIconPositionY if both images are laid out
    if (secondImageY.value !== 0 && secondImageHeight.value !== 0) {
      initialIconPositionY.value =
        (firstImageY.value +
          secondImageY.value +
          firstImageHeight.value +
          secondImageHeight.value) /
          2 -
        45;
    }
  };

  const onSecondImageLayout = (event: LayoutChangeEvent) => {
    const {y, height} = event.nativeEvent.layout;
    secondImageY.value = y;
    secondImageHeight.value = height;

    // Calculate initialIconPositionY if both images are laid out
    if (firstImageY.value !== 0 && firstImageHeight.value !== 0) {
      initialIconPositionY.value =
        (firstImageY.value +
          secondImageY.value +
          firstImageHeight.value +
          secondImageHeight.value) /
          2 -
        45;
    }
  };

  return (
    <GestureHandlerRootView style={[styles.area]}>
      <SafeAreaView style={[styles.area]}>
        <View style={[styles.container]}>
          <GestureDetector gesture={panGesture}>
            <View
              style={[
                styles.images,
                {position: 'relative', alignItems: 'center'},
              ]}>
              {Array.isArray(data) &&
                data.map((el, idx) => {
                  return (
                    <TouchableWithoutFeedback key={el?.image?.id}>
                      <Animated.View
                        onLayout={
                          idx === 0 ? onFirstImageLayout : onSecondImageLayout
                        }
                        style={[
                          styles.imageWrap,
                          idx === 0 ? firstImageStyle : secondImageStyle,
                        ]}>
                        <Image
                          style={[styles.image]}
                          source={{uri: el?.image?.url}}
                        />
                        {selectedAnswer === idx && (
                          <>
                            {data[selectedAnswer].action ===
                              Actions.Correct && (
                              <Animated.View
                                style={[styles.gradientWrap, gradientStyle]}>
                                <AnimatedLinearGradient
                                  colors={[
                                    'rgba(93,195,45,0.5)',
                                    'transparent',
                                  ]}
                                  start={{x: 0.5, y: 0}}
                                  end={{x: 0.5, y: 1}}
                                  style={styles.topGradient}
                                />
                                <AnimatedLinearGradient
                                  colors={[
                                    'transparent',
                                    'rgba(93,195,45,0.5)',
                                  ]}
                                  start={{x: 0.5, y: 0}}
                                  end={{x: 0.5, y: 1}}
                                  style={styles.bottomGradient}
                                />
                                <AnimatedLinearGradient
                                  colors={[
                                    'rgba(93,195,45,0.5)',
                                    'transparent',
                                  ]}
                                  start={{x: 0, y: 0.5}}
                                  end={{x: 1, y: 0.5}}
                                  style={styles.leftGradient}
                                />
                                <AnimatedLinearGradient
                                  colors={[
                                    'transparent',
                                    'rgba(93,195,45,0.5)',
                                  ]}
                                  start={{x: 0, y: 0.5}}
                                  end={{x: 1, y: 0.5}}
                                  style={styles.rightGradient}
                                />
                              </Animated.View>
                            )}
                            {data[selectedAnswer].action === Actions.Wrong && (
                              <Animated.View
                                style={[styles.gradientWrap, gradientStyle]}>
                                <AnimatedLinearGradient
                                  colors={[
                                    'rgba(255,41,41,0.5)',
                                    'transparent',
                                  ]}
                                  start={{x: 0.5, y: 0}}
                                  end={{x: 0.5, y: 1}}
                                  style={styles.topGradient}
                                />
                                <AnimatedLinearGradient
                                  colors={[
                                    'transparent',
                                    'rgba(255,41,41,0.5)',
                                  ]}
                                  start={{x: 0.5, y: 0}}
                                  end={{x: 0.5, y: 1}}
                                  style={styles.bottomGradient}
                                />
                                <AnimatedLinearGradient
                                  colors={[
                                    'rgba(255,41,41,0.5)',
                                    'transparent',
                                  ]}
                                  start={{x: 0, y: 0.5}}
                                  end={{x: 1, y: 0.5}}
                                  style={styles.leftGradient}
                                />
                                <AnimatedLinearGradient
                                  colors={[
                                    'transparent',
                                    'rgba(255,41,41,0.5)',
                                  ]}
                                  start={{x: 0, y: 0.5}}
                                  end={{x: 1, y: 0.5}}
                                  style={styles.rightGradient}
                                />
                              </Animated.View>
                            )}
                          </>
                        )}
                        {selectedAnswer === idx && (
                          <Respond
                            isSuccess={
                              data[selectedAnswer].action === Actions.Correct
                            }
                          />
                        )}
                      </Animated.View>
                    </TouchableWithoutFeedback>
                  );
                })}

              {/* IconCheckmark */}
              <Animated.View
                style={[
                  styles.checkmarkWrapper,
                  iconTranslateYStyle,
                  {
                    position: 'absolute',
                    left: '50%',
                    marginLeft: -22,
                  },
                ]}>
                <IconCheckmark />
              </Animated.View>
            </View>
          </GestureDetector>

          {/* Left and Right Icons (iconCircle) */}
          <Animated.View style={[styles.iconCircle, {left: 0}, leftIconStyle]}>
            <Text style={styles.iconText}>{'🔄'}</Text>
          </Animated.View>
          <Animated.View
            style={[styles.iconCircle, {right: 0}, rightIconStyle]}>
            <Text style={styles.iconText}>{'🤔'}</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default App;
