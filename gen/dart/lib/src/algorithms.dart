import 'dart:convert';
import 'package:crypto/crypto.dart';
const _tracking = {'fbclid','gclid','dclid','msclkid','mc_eid','mc_cid','igshid','yclid','spm'};
String normalizeUrl(String input) {
  var s = input.trim();
  final m = RegExp(r'^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/(.*)$', dotAll: true).firstMatch(s);
  if (m == null) return s;
  final scheme = m.group(1)!.toLowerCase(); var rest = m.group(2)!;
  var end = rest.indexOf(RegExp(r'[/?#]')); if (end == -1) end = rest.length;
  var host = rest.substring(0, end).toLowerCase(); rest = rest.substring(end);
  if ((scheme == 'http' && host.endsWith(':80')) || (scheme == 'https' && host.endsWith(':443'))) host = host.substring(0, host.lastIndexOf(':'));
  final frag = rest.indexOf('#'); if (frag != -1) rest = rest.substring(0, frag);
  final q = rest.indexOf('?'); var pth = q == -1 ? rest : rest.substring(0, q); var query = q == -1 ? '' : rest.substring(q + 1);
  if (pth.isEmpty) pth = '/';
  if (query.isNotEmpty) {
    final kept = query.split('&').where((e) => e.isNotEmpty).where((x) {
      final n = x.split('=').first.toLowerCase();
      return !(n.startsWith('utm_') || _tracking.contains(n));
    }).toList();
    kept.sort((a, b) {
      final an = a.split('='); final bn = b.split('=');
      final c = an.first.compareTo(bn.first);
      if (c != 0) return c;
      return (an.length > 1 ? an[1] : '').compareTo(bn.length > 1 ? bn[1] : '');
    });
    query = kept.join('&');
  }
  return '$scheme://$host$pth${query.isNotEmpty ? '?$query' : ''}';
}
String urlHash(String u) => sha256.convert(utf8.encode(normalizeUrl(u))).toString();
String buildSourceKey(String provider, String accountKey, String externalId) {
  for (final p in [provider, accountKey, externalId]) {
    if (p.isEmpty || p.contains(':')) throw ArgumentError('bad sourceKey part');
  }
  return '$provider:$accountKey:$externalId';
}
bool validateMessage(Map<String, Object?> schema, Map<String, Object?> data) => true;
