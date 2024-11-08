import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  area: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 60,
  },
  images: {
    flex: 1,
  },
  imageWrap: {
    flex: 0.5,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  selected: {
    borderColor: 'blue',
    borderWidth: 2,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#cacaca',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 3.05,
    elevation: 4,
    position: 'absolute',
    top: '52%',
  },
  iconText: {
    fontSize: 30,
  },
  respond: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkWrapper: {
    position: 'absolute',
    width: 90,
    height: 90,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50, // Adjust as needed
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50, // Adjust as needed
  },
  leftGradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 50, // Adjust as needed
  },
  rightGradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 50, // Adjust as needed
  },
  gradientWrap: {
    left: 0,
    top: 0,
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});

export default styles;
