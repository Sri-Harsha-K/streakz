import { registerRootComponent } from 'expo';

// Define the background notification-response TaskManager task at module
// init time so the OS can dispatch to it even when the app is killed. Must
// import before App so defineTask runs before any screen mounts. Also fires
// off registerNotificationResponseTask so the OS knows to route action
// responses through it.
import { registerNotificationResponseTask } from './src/utils/notificationTask';
import App from './App';

void registerNotificationResponseTask();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
