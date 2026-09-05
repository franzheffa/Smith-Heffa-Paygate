import 'dart:convert';
import 'dart:async';

import 'package:http/http.dart' as http;

class PaygateApiException implements Exception {
  PaygateApiException(this.code, this.message);

  final String code;
  final String message;
}

class PlaceSuggestion {
  const PlaceSuggestion({required this.id, required this.label, required this.iataCode, required this.countryCode});

  final String id;
  final String label;
  final String iataCode;
  final String countryCode;

  factory PlaceSuggestion.fromJson(Map<String, dynamic> json) {
    final type = json['type'] as String? ?? '';
    final name = json['name'] as String? ?? json['city_name'] as String? ?? 'Lieu';
    final iata = json['iata_code'] as String? ?? '';
    final city = json['city_name'] as String? ?? '';
    final country = json['iata_country_code'] as String? ?? json['country_code'] as String? ?? '';
    final label = [name, if (city.isNotEmpty && city != name) city, if (iata.isNotEmpty) iata, if (country.isNotEmpty) country]
        .where((value) => value.isNotEmpty)
        .join(' · ');
    return PlaceSuggestion(id: json['id'] as String? ?? '$type:$iata:$name', label: label, iataCode: iata, countryCode: country);
  }
}

class FlightOffer {
  const FlightOffer({
    required this.id,
    required this.airline,
    required this.providerFare,
    required this.currency,
    required this.duration,
    required this.stops,
    required this.departureAt,
    required this.arrivalAt,
    required this.expiresAt,
    required this.route,
  });

  final String id;
  final String airline;
  final String providerFare;
  final String currency;
  final Duration duration;
  final int stops;
  final DateTime? departureAt;
  final DateTime? arrivalAt;
  final DateTime? expiresAt;
  final String route;

  factory FlightOffer.fromJson(Map<String, dynamic> json) {
    final slices = (json['slices'] as List? ?? const []).whereType<Map>().toList();
    final firstSlice = slices.isNotEmpty ? Map<String, dynamic>.from(slices.first) : const <String, dynamic>{};
    final segments = (firstSlice['segments'] as List? ?? const []).whereType<Map>().toList();
    final firstSegment = segments.isNotEmpty ? Map<String, dynamic>.from(segments.first) : const <String, dynamic>{};
    final lastSegment = segments.isNotEmpty ? Map<String, dynamic>.from(segments.last) : const <String, dynamic>{};
    final summary = json['summary'] is Map ? Map<String, dynamic>.from(json['summary'] as Map) : const <String, dynamic>{};
    final carrier = summary['primary_carrier'] as String? ?? ((firstSegment['marketing_carrier'] as Map?)?['name'] as String?) ?? 'Compagnie aerienne';
    final departure = DateTime.tryParse(firstSegment['departing_at'] as String? ?? '');
    final arrival = DateTime.tryParse(lastSegment['arriving_at'] as String? ?? '');
    final duration = _duration(firstSlice['duration'] as String? ?? '');
    final origin = (firstSegment['origin'] as Map?)?['iata_code'] as String? ?? '';
    final destination = (lastSegment['destination'] as Map?)?['iata_code'] as String? ?? '';
    return FlightOffer(
      id: json['id'] as String? ?? '',
      airline: carrier,
      providerFare: json['total_amount']?.toString() ?? '',
      currency: json['total_currency'] as String? ?? '',
      duration: duration,
      stops: (summary['connections'] as num?)?.toInt() ?? (segments.length - 1).clamp(0, 99).toInt(),
      departureAt: departure,
      arrivalAt: arrival,
      expiresAt: DateTime.tryParse(json['expires_at'] as String? ?? ''),
      route: '$origin -> $destination',
    );
  }

  // Used only to order provider results; checkout totals remain server-authoritative.
  int get sortMinorUnits {
    final parts = providerFare.split('.');
    final whole = int.tryParse(parts.first) ?? 1 << 62;
    final fraction = parts.length > 1 ? int.tryParse('${parts[1]}00'.substring(0, 2)) ?? 0 : 0;
    return whole * 100 + fraction;
  }

  static Duration _duration(String iso) {
    final match = RegExp(r'^PT(?:(\\d+)H)?(?:(\\d+)M)?$').firstMatch(iso);
    if (match == null) return Duration.zero;
    return Duration(hours: int.tryParse(match.group(1) ?? '') ?? 0, minutes: int.tryParse(match.group(2) ?? '') ?? 0);
  }
}

class RailCapability {
  const RailCapability({required this.rail, required this.status, required this.available});

  final String rail;
  final String status;
  final bool available;

  factory RailCapability.fromJson(Map<String, dynamic> json) => RailCapability(
        rail: json['rail'] as String? ?? 'Rail',
        status: json['status'] as String? ?? 'UNAVAILABLE',
        available: json['available'] == true,
      );
}

class CheckoutPreview {
  const CheckoutPreview({required this.checkoutId, required this.amount, required this.currency, required this.expiresAt, required this.rail, required this.pricing});

  final String checkoutId;
  final String amount;
  final String currency;
  final DateTime? expiresAt;
  final String rail;
  final PricingSnapshot? pricing;

  factory CheckoutPreview.fromJson(Map<String, dynamic> json) => CheckoutPreview(
        checkoutId: json['checkoutId'] as String? ?? '',
        amount: json['amount']?.toString() ?? '',
        currency: json['currency'] as String? ?? '',
        expiresAt: DateTime.tryParse(json['expiresAt'] as String? ?? ''),
      rail: json['rail'] as String? ?? '',
      pricing: json['pricing'] is Map ? PricingSnapshot.fromJson(Map<String, dynamic>.from(json['pricing'] as Map)) : null,
      );
}

class PricingSnapshot {
  const PricingSnapshot({required this.version, required this.providerFare, required this.fixedTicketingFee, required this.railFee, required this.total, required this.currency, required this.ticketCount});

  final String version;
  final String providerFare;
  final String fixedTicketingFee;
  final String railFee;
  final String total;
  final String currency;
  final int ticketCount;

  factory PricingSnapshot.fromJson(Map<String, dynamic> json) => PricingSnapshot(
        version: json['pricingVersion'] as String? ?? '',
        providerFare: json['providerFare']?.toString() ?? '',
        fixedTicketingFee: json['fixedTicketingFee']?.toString() ?? '',
        railFee: json['railFee']?.toString() ?? '',
        total: json['total']?.toString() ?? '',
        currency: json['currency'] as String? ?? '',
        ticketCount: (json['ticketCount'] as num?)?.toInt() ?? 0,
      );
}

class PaygateApi {
  PaygateApi({http.Client? client, Uri? baseUri})
      : _client = client ?? http.Client(),
        _baseUri = baseUri ?? Uri.parse('https://smith-heffa-paygate.ca');

  final http.Client _client;
  final Uri _baseUri;

  Future<List<PlaceSuggestion>> places(String query) async {
    final response = await _get('/api/duffel/places', {'query': query, 'limit': '8'});
    final data = _json(response) as Map<String, dynamic>;
    return (data['data'] as List? ?? const []).whereType<Map>().map((item) => PlaceSuggestion.fromJson(Map<String, dynamic>.from(item))).where((place) => place.iataCode.isNotEmpty).toList();
  }

  Future<List<FlightOffer>> searchFlights({required List<Map<String, String>> slices, required int passengerCount, required String cabin, required bool directOnly}) async {
    final response = await _post('/api/duffel/offer-requests', {
      'slices': slices,
      'passenger_count': passengerCount,
      'cabin_class': cabin,
      'direct_only': directOnly,
      'limit': 50,
    });
    final data = _json(response) as Map<String, dynamic>;
    final payload = data['data'] as Map<String, dynamic>? ?? const {};
    return (payload['offers'] as List? ?? const []).whereType<Map>().map((item) => FlightOffer.fromJson(Map<String, dynamic>.from(item))).toList();
  }

  Future<List<RailCapability>> capabilities() async {
    final response = await _get('/api/mobile/capabilities', const {});
    final data = _json(response) as Map<String, dynamic>;
    return (data['rails'] as List? ?? const []).whereType<Map>().map((item) => RailCapability.fromJson(Map<String, dynamic>.from(item))).toList();
  }

  Future<CheckoutPreview> prepareCheckout({required String offerId, required String preferredRail}) async {
    final response = await _post('/api/mobile/checkout/prepare', {'offerId': offerId, 'preferredPaymentRail': preferredRail});
    return CheckoutPreview.fromJson(_json(response) as Map<String, dynamic>);
  }

  Future<http.Response> _get(String path, Map<String, String> query) => _request(() => _client.get(_baseUri.replace(path: path, queryParameters: query)));
  Future<http.Response> _post(String path, Map<String, dynamic> body) => _request(() => _client.post(_baseUri.replace(path: path), headers: const {'Content-Type': 'application/json'}, body: jsonEncode(body)));

  Future<http.Response> _request(Future<http.Response> Function() request) async {
    try {
      final response = await request().timeout(const Duration(seconds: 25));
      if (response.statusCode >= 200 && response.statusCode < 300) return response;
      final data = _decode(response.body);
      throw PaygateApiException(data['code']?.toString() ?? 'SERVER_ERROR', data['error']?.toString() ?? 'Le service est indisponible.');
    } on http.ClientException {
      throw PaygateApiException('NO_CONNECTION', 'Connexion indisponible. Verifiez votre reseau puis reessayez.');
    } on TimeoutException {
      throw PaygateApiException('TIMEOUT', 'Le service a mis trop de temps a repondre.');
    }
  }

  dynamic _json(http.Response response) => _decode(response.body);
  Map<String, dynamic> _decode(String body) {
    try {
      final value = jsonDecode(body);
      return value is Map<String, dynamic> ? value : const {};
    } catch (_) {
      return const {};
    }
  }
}
