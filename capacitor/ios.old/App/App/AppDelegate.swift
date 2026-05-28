import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: CAPAppDelegate {
    override func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        WKWebView.customUserAgent = "LLMConclaveCapacitor/1.0"
        bridge?.webView?.scrollView.bounces = false
        return super.application(application, didFinishLaunchingWithOptions: launchOptions)
    }
}
