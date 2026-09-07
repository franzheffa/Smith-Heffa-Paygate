// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:html' as html;

class AuthTraceStore {
  static const _pendingKey = 'smith_heffa_auth_redirect_pending_v1';

  String get origin => html.window.location.origin;
  bool get redirectPending => html.window.sessionStorage[_pendingKey] == 'true';

  void markRedirectPending() {
    html.window.sessionStorage[_pendingKey] = 'true';
  }

  void clearRedirectPending() {
    html.window.sessionStorage.remove(_pendingKey);
  }
}
