class AuthTraceStore {
  static bool _redirectPending = false;

  String get origin => 'non-web';
  bool get redirectPending => _redirectPending;

  void markRedirectPending() {
    _redirectPending = true;
  }

  void clearRedirectPending() {
    _redirectPending = false;
  }
}
