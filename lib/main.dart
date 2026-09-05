import 'dart:async';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'paygate_api.dart';

const _ink = Color(0xff101114);
const _gold = Color(0xffc6a85b);

void main() => runApp(const PaygateApp());

class PaygateApp extends StatelessWidget {
  const PaygateApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Smith-Heffa Paygate',
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(seedColor: _gold),
          scaffoldBackgroundColor: const Color(0xfff6f5f2),
        ),
        home: const MobileShell(),
      );
}

class MobileShell extends StatefulWidget {
  const MobileShell({super.key});

  @override
  State<MobileShell> createState() => _MobileShellState();
}

class _MobileShellState extends State<MobileShell> {
  int _index = 0;
  static const _titles = ['Accueil', 'Payer', 'Voyage', 'Activite', 'Compte'];

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          backgroundColor: _ink,
          foregroundColor: Colors.white,
          title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('SMITH-HEFFA PAYGATE', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 1)),
            Text(_titles[_index], style: const TextStyle(fontSize: 12, color: Color(0xffd8d8db))),
          ]),
          actions: const [Padding(padding: EdgeInsets.only(right: 16), child: Icon(Icons.shield_outlined, color: _gold))],
        ),
        body: SafeArea(child: [
          HomePage(onNavigate: (index) => setState(() => _index = index)),
          const PayPage(),
          const TravelPage(),
          const ActivityPage(),
          const AccountPage(),
        ][_index]),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _index,
          onDestinationSelected: (value) => setState(() => _index = value),
          destinations: const [
            NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Accueil'),
            NavigationDestination(icon: Icon(Icons.payments_outlined), selectedIcon: Icon(Icons.payments), label: 'Payer'),
            NavigationDestination(icon: Icon(Icons.flight_outlined), selectedIcon: Icon(Icons.flight), label: 'Voyage'),
            NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'Activite'),
            NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Compte'),
          ],
        ),
      );
}

class PageFrame extends StatelessWidget {
  const PageFrame({super.key, required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 30),
        children: [...children, const SizedBox(height: 24), const CompactLegalFooter()],
      );
}

class HomePage extends StatelessWidget {
  const HomePage({super.key, required this.onNavigate});
  final ValueChanged<int> onNavigate;
  @override
  Widget build(BuildContext context) => PageFrame(children: [
        BrandHero(),
        const SectionTitle('Actions rapides'),
        Wrap(spacing: 10, runSpacing: 10, children: [
          QuickAction(Icons.account_balance_wallet_outlined, 'Universal Checkout', onTap: () => onNavigate(1)),
          QuickAction(Icons.flight_takeoff_outlined, 'Rechercher un vol', onTap: () => onNavigate(2)),
          QuickAction(Icons.receipt_long_outlined, 'Activite', onTap: () => onNavigate(3)),
          QuickAction(Icons.shield_outlined, 'Securite', onTap: () => onNavigate(4)),
        ]),
        const SectionTitle('Apercu des rails'),
        const InfoCard(title: 'Paiements internationaux', detail: 'Stripe, Apple Pay, PayPal, Pix et Mobile Money. Preparation uniquement dans cette Preview.', icon: Icons.public),
        const InfoCard(title: 'FDX et operations', detail: 'Les activites reelles restent cote API et ne sont pas simulees.', icon: Icons.hub_outlined),
      ]);
}

class PayPage extends StatefulWidget {
  const PayPage({super.key});

  @override
  State<PayPage> createState() => _PayPageState();
}

class _PayPageState extends State<PayPage> {
  final _amount = TextEditingController();
  String _rail = 'Stripe';
  PayState _state = PayState.disabled;
  String? _message;

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  void _prepare() {
    final value = double.tryParse(_amount.text.replaceAll(',', '.'));
    setState(() {
      if (value == null || value <= 0) {
        _state = PayState.error;
        _message = 'Saisissez un montant valide avant de preparer une intention.';
      } else {
        _state = PayState.authRequired;
        _message = 'Validation locale terminee. Une session authentifiee et un contrat serveur sont requis avant Universal Checkout. Aucune session, charge ou debit n a ete cree.';
      }
    });
  }

  @override
  Widget build(BuildContext context) => PageFrame(children: [
        const Notice('Mode Preview sans execution', 'Aucun paiement, debit, intent ou session n est cree depuis cette experience.'),
        const SectionTitle('Preparer un paiement'),
        Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          TextField(controller: _amount, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Montant', prefixText: 'XAF ', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(initialValue: _rail, decoration: const InputDecoration(labelText: 'Rail', border: OutlineInputBorder()), items: RailGrid.rails.map((rail) => DropdownMenuItem(value: rail, child: Text(rail))).toList(), onChanged: (value) => setState(() => _rail = value ?? _rail)),
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: _prepare, icon: const Icon(Icons.route_outlined), label: const Text('Valider localement'))),
          const SizedBox(height: 8),
          PayStateChip(state: _state),
          if (_message != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_message!, style: const TextStyle(height: 1.35))),
        ]))),
        const SectionTitle('Etat des rails'),
        const RailGrid(),
        const InfoCard(title: 'Universal Checkout', detail: 'Le parcours collecte des choix locaux uniquement. La creation de session reste desactivee tant que les contrats serveur ne sont pas valides.', icon: Icons.account_tree_outlined),
      ]);
}

enum PayState { disabled, loading, error, authRequired }

class PayStateChip extends StatelessWidget {
  const PayStateChip({super.key, required this.state});
  final PayState state;

  @override
  Widget build(BuildContext context) {
    final label = switch (state) {
      PayState.disabled => 'DISABLED - aucune session provider',
      PayState.loading => 'LOADING - validation locale',
      PayState.error => 'ERROR - montant invalide',
      PayState.authRequired => 'AUTH_REQUIRED - Universal Checkout protege',
    };
    return Semantics(label: 'Etat paiement: $label', child: Chip(avatar: const Icon(Icons.shield_outlined, size: 18), label: Text(label)));
  }
}

class TravelPage extends StatefulWidget {
  const TravelPage({super.key});

  @override
  State<TravelPage> createState() => _TravelPageState();
}

class _TravelPageState extends State<TravelPage> {
  final _api = PaygateApi();
  final _origin = TextEditingController();
  final _destination = TextEditingController();
  final _originFocus = FocusNode();
  var _roundTrip = false;
  var _cabin = 'economy';
  var _passengers = 1;
  DateTime? _departureDate;
  DateTime? _returnDate;
  TravelState _state = TravelState.initial;
  String? _message;
  Timer? _placeDebounce;
  bool _loadingPlaces = false;
  bool _directOnly = false;
  String _sort = 'recommended';
  List<PlaceSuggestion> _suggestions = const [];
  List<FlightOffer> _offers = const [];

  @override
  void dispose() {
    _origin.dispose();
    _destination.dispose();
    _originFocus.dispose();
    _placeDebounce?.cancel();
    super.dispose();
  }

  void _lookupPlaces(String query) {
    _placeDebounce?.cancel();
    if (query.trim().length < 2) {
      setState(() => _suggestions = const []);
      return;
    }
    _placeDebounce = Timer(const Duration(milliseconds: 350), () async {
      setState(() => _loadingPlaces = true);
      try {
        final places = await _api.places(query);
        if (mounted) setState(() => _suggestions = places);
      } on PaygateApiException catch (error) {
        if (mounted) setState(() { _state = error.code == 'NO_CONNECTION' ? TravelState.offline : TravelState.error; _message = error.message; });
      } finally {
        if (mounted) setState(() => _loadingPlaces = false);
      }
    });
  }

  Future<void> _search() async {
    final origin = _origin.text.trim().toUpperCase();
    final destination = _destination.text.trim().toUpperCase();
    if (origin.length != 3 || destination.length != 3 || origin == destination) {
      setState(() { _state = TravelState.error; _message = 'Choisissez deux aeroports IATA distincts, par exemple DLA et CDG.'; });
      return;
    }
    if (_departureDate == null || (_roundTrip && (_returnDate == null || !_returnDate!.isAfter(_departureDate!)))) {
      setState(() { _state = TravelState.error; _message = 'Ajoutez un depart valide et un retour apres le depart.'; });
      return;
    }
    setState(() { _state = TravelState.loading; _message = 'Recherche des offres Duffel...'; _offers = const []; _suggestions = const []; });
    try {
      final offers = await _api.searchFlights(
        slices: [
          {'origin': origin, 'destination': destination, 'departure_date': _isoDate(_departureDate!)},
          if (_roundTrip) {'origin': destination, 'destination': origin, 'departure_date': _isoDate(_returnDate!)},
        ],
        passengerCount: _passengers,
        cabin: _cabin,
        directOnly: _directOnly,
      );
      if (mounted) setState(() { _offers = offers; _state = offers.isEmpty ? TravelState.empty : TravelState.success; _message = offers.isEmpty ? 'Aucune offre disponible. Modifiez les criteres et reessayez.' : '${offers.length} offre${offers.length > 1 ? 's' : ''} reelle${offers.length > 1 ? 's' : ''} recue${offers.length > 1 ? 's' : ''}.'; });
    } on PaygateApiException catch (error) {
      if (mounted) setState(() { _state = error.code == 'NO_CONNECTION' ? TravelState.offline : TravelState.error; _message = error.message; });
    }
  }

  Future<void> _pickDate({required bool isReturn}) async {
    final now = DateTime.now();
    final selected = await showDatePicker(
      context: context,
      firstDate: now,
      lastDate: DateTime(now.year + 2),
      initialDate: isReturn ? (_returnDate ?? _departureDate ?? now) : (_departureDate ?? now),
    );
    if (selected == null || !mounted) return;
    setState(() {
      if (isReturn) {
        _returnDate = selected;
      } else {
        _departureDate = selected;
        if (_returnDate != null && _returnDate!.isBefore(selected)) _returnDate = null;
      }
    });
  }

  String _dateLabel(DateTime? date, String label) => date == null ? label : '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  String _isoDate(DateTime date) => '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

  List<FlightOffer> get _sortedOffers {
    final values = [..._offers];
    if (_sort == 'lowest') values.sort((a, b) => a.amount.compareTo(b.amount));
    if (_sort == 'shortest') values.sort((a, b) => a.duration.compareTo(b.duration));
    if (_sort == 'earliest') values.sort((a, b) => (a.departureAt ?? DateTime(9999)).compareTo(b.departureAt ?? DateTime(9999)));
    return values;
  }

  Future<void> _openCheckout(FlightOffer offer) async {
    try {
      final capabilities = await _api.capabilities();
      if (mounted) await showModalBottomSheet<void>(context: context, isScrollControlled: true, builder: (context) => CheckoutSheet(api: _api, offer: offer, capabilities: capabilities));
    } on PaygateApiException catch (error) {
      if (mounted) setState(() { _state = TravelState.error; _message = error.message; });
    }
  }

  @override
  Widget build(BuildContext context) => PageFrame(children: [
        const Notice('Duffel en lecture seule', 'Aucun ordre, hold, paiement ou donnee passager n est envoye depuis cette Preview.'),
        const SectionTitle('Rechercher un vol'),
        Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SegmentedButton<bool>(
            segments: const [ButtonSegment(value: false, label: Text('Aller simple')), ButtonSegment(value: true, label: Text('Aller-retour'))],
            selected: {_roundTrip},
            onSelectionChanged: (value) => setState(() => _roundTrip = value.first),
          ),
          const SizedBox(height: 16),
          TextField(controller: _origin, focusNode: _originFocus, textCapitalization: TextCapitalization.characters, decoration: const InputDecoration(labelText: 'Depart', hintText: 'Douala ou DLA', border: OutlineInputBorder()), onChanged: _lookupPlaces),
          const SizedBox(height: 10),
          TextField(controller: _destination, textCapitalization: TextCapitalization.characters, decoration: const InputDecoration(labelText: 'Arrivee', hintText: 'Paris ou CDG', border: OutlineInputBorder()), onChanged: _lookupPlaces),
          if (_loadingPlaces) const Padding(padding: EdgeInsets.only(top: 8), child: LinearProgressIndicator()),
          if (_suggestions.isNotEmpty)
            Container(
              margin: const EdgeInsets.only(top: 8),
              decoration: BoxDecoration(border: Border.all(color: const Color(0xffdfdfe5)), borderRadius: BorderRadius.circular(12)),
              child: Column(
                children: _suggestions.take(4).map((place) => ListTile(
                      dense: true,
                      title: Text(place.label),
                      onTap: () => setState(() {
                        if (_originFocus.hasFocus) {
                          _origin.text = place.iataCode;
                        } else {
                          _destination.text = place.iataCode;
                        }
                        _suggestions = const [];
                      }),
                    )).toList(),
              ),
            ),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: OutlinedButton.icon(onPressed: () => _pickDate(isReturn: false), icon: const Icon(Icons.calendar_month_outlined), label: Text(_dateLabel(_departureDate, 'Depart')))),
            if (_roundTrip) ...[const SizedBox(width: 10), Expanded(child: OutlinedButton.icon(onPressed: () => _pickDate(isReturn: true), icon: const Icon(Icons.calendar_month_outlined), label: Text(_dateLabel(_returnDate, 'Retour'))))],
          ]),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(initialValue: _cabin, decoration: const InputDecoration(labelText: 'Cabine', border: OutlineInputBorder()), items: const [DropdownMenuItem(value: 'economy', child: Text('Economy')), DropdownMenuItem(value: 'premium_economy', child: Text('Premium Economy')), DropdownMenuItem(value: 'business', child: Text('Business')), DropdownMenuItem(value: 'first', child: Text('First'))], onChanged: (value) => setState(() => _cabin = value ?? _cabin)),
          const SizedBox(height: 8),
          SwitchListTile.adaptive(contentPadding: EdgeInsets.zero, title: const Text('Vols directs uniquement'), value: _directOnly, onChanged: (value) => setState(() => _directOnly = value)),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('Passagers'), Row(children: [IconButton(onPressed: _passengers > 1 ? () => setState(() => _passengers--) : null, icon: const Icon(Icons.remove_circle_outline)), Text('$_passengers'), IconButton(onPressed: _passengers < 9 ? () => setState(() => _passengers++) : null, icon: const Icon(Icons.add_circle_outline))])]),
          SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: _state == TravelState.loading ? null : _search, icon: const Icon(Icons.search), label: const Text('Rechercher les offres'))),
          if (_message != null) Padding(padding: const EdgeInsets.only(top: 12), child: TravelStateNotice(state: _state, message: _message!)),
        ]))),
        const SectionTitle('Offres'),
        if (_offers.isEmpty) const InfoCard(title: 'Aucune offre chargee', detail: 'Les offres sont affichees uniquement apres une recherche Duffel reussie. Aucun resultat n est simule.', icon: Icons.airplane_ticket_outlined),
        if (_offers.isNotEmpty) DropdownButtonFormField<String>(initialValue: _sort, decoration: const InputDecoration(labelText: 'Trier les offres', border: OutlineInputBorder()), items: const [DropdownMenuItem(value: 'recommended', child: Text('Recommande')), DropdownMenuItem(value: 'lowest', child: Text('Prix le plus bas')), DropdownMenuItem(value: 'shortest', child: Text('Duree la plus courte')), DropdownMenuItem(value: 'earliest', child: Text('Depart le plus tot'))], onChanged: (value) => setState(() => _sort = value ?? _sort)),
        ..._sortedOffers.map((offer) => FlightOfferCard(offer: offer, onSelect: () => _openCheckout(offer))),
      ]);
}

class FlightOfferCard extends StatelessWidget {
  const FlightOfferCard({super.key, required this.offer, required this.onSelect});
  final FlightOffer offer;
  final VoidCallback onSelect;
  String _time(DateTime? value) => value == null ? '--:--' : '${value.hour.toString().padLeft(2, '0')}:${value.minute.toString().padLeft(2, '0')}';
  @override
  Widget build(BuildContext context) => Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [Expanded(child: Text(offer.airline, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17))), Text('${offer.amount.toStringAsFixed(2)} ${offer.currency}', style: const TextStyle(fontWeight: FontWeight.w800))]),
        const SizedBox(height: 10), Text('${offer.route}  ${_time(offer.departureAt)} - ${_time(offer.arrivalAt)}'),
        Text('${offer.duration.inHours}h ${offer.duration.inMinutes.remainder(60).toString().padLeft(2, '0')} · ${offer.stops == 0 ? 'Direct' : '${offer.stops} escale${offer.stops > 1 ? 's' : ''}'}', style: const TextStyle(color: Color(0xff5d5d65))),
        if (offer.expiresAt != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text('Offre valable jusqu a ${_time(offer.expiresAt)}', style: const TextStyle(fontSize: 12, color: Color(0xff8c6100)))),
        const SizedBox(height: 12), SizedBox(width: double.infinity, child: OutlinedButton(onPressed: onSelect, child: const Text('Selectionner le vol'))),
      ])));
}

class CheckoutSheet extends StatefulWidget {
  const CheckoutSheet({super.key, required this.api, required this.offer, required this.capabilities});
  final PaygateApi api;
  final FlightOffer offer;
  final List<RailCapability> capabilities;
  @override
  State<CheckoutSheet> createState() => _CheckoutSheetState();
}

class _CheckoutSheetState extends State<CheckoutSheet> {
  String? _rail;
  CheckoutPreview? _checkout;
  String? _error;
  bool _loading = false;
  Future<void> _prepare() async {
    setState(() { _loading = true; _error = null; });
    try {
      final preview = await widget.api.prepareCheckout(offerId: widget.offer.id, preferredRail: _rail!);
      if (mounted) setState(() => _checkout = preview);
    } on PaygateApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally { if (mounted) setState(() => _loading = false); }
  }
  @override
  Widget build(BuildContext context) => SafeArea(child: Padding(padding: const EdgeInsets.all(20), child: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Universal Checkout', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 22)), const SizedBox(height: 8), Text('${widget.offer.airline} · ${widget.offer.amount.toStringAsFixed(2)} ${widget.offer.currency}'),
        const SizedBox(height: 12), const Notice('Preparation uniquement', 'Le serveur relit l offre et son prix. Aucun paiement, passager ou ordre n est cree.'), const SizedBox(height: 12),
        ...widget.capabilities.map((rail) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(rail.available ? Icons.verified_outlined : Icons.lock_outline),
              title: Text(rail.rail),
              subtitle: Text(rail.status),
              trailing: ChoiceChip(label: Text(rail.available ? 'Choisir' : 'Indisponible'), selected: _rail == rail.rail, onSelected: rail.available ? (_) => setState(() => _rail = rail.rail) : null),
            )),
        if (!widget.capabilities.any((rail) => rail.available)) const Padding(padding: EdgeInsets.only(bottom: 12), child: Text('Aucun rail de paiement n est confirme par le backend. Aucun checkout ne peut etre initie.', style: TextStyle(color: Color(0xff8c6100)))),
        SizedBox(width: double.infinity, child: FilledButton(onPressed: _loading || _rail == null ? null : _prepare, child: Text(_loading ? 'Revalidation...' : 'Revalider et preparer'))),
        if (_checkout != null) Padding(padding: const EdgeInsets.only(top: 12), child: TravelStateNotice(state: TravelState.success, message: 'CHECKOUT_CREATED · ${_checkout!.amount} ${_checkout!.currency} · execution paiement et booking desactivee.')),
        if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: TravelStateNotice(state: TravelState.error, message: _error!)),
      ]))));
}

enum TravelState { initial, loading, success, empty, error, offline }

class TravelStateNotice extends StatelessWidget {
  const TravelStateNotice({super.key, required this.state, required this.message});
  final TravelState state;
  final String message;

  @override
  Widget build(BuildContext context) {
    final (color, icon, label) = switch (state) {
      TravelState.initial => (const Color(0xff5d5d65), Icons.info_outline, 'INITIAL'),
      TravelState.loading => (const Color(0xff175cd3), Icons.hourglass_top_outlined, 'LOADING'),
      TravelState.success => (const Color(0xff067647), Icons.check_circle_outline, 'SUCCESS'),
      TravelState.empty => (const Color(0xff8c6100), Icons.airplane_ticket_outlined, 'EMPTY'),
      TravelState.error => (const Color(0xffb42318), Icons.error_outline, 'ERROR'),
      TravelState.offline => (const Color(0xff8c6100), Icons.cloud_off_outlined, 'OFFLINE'),
    };
    return Semantics(
      liveRegion: true,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withValues(alpha: 0.35))),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(icon, color: color), const SizedBox(width: 8), Expanded(child: Text('$label: $message', style: const TextStyle(height: 1.35)))]),
      ),
    );
  }
}

class ActivityPage extends StatelessWidget {
  const ActivityPage({super.key});
  @override
  Widget build(BuildContext context) => PageFrame(children: const [
        SectionTitle('Activite'),
        InfoCard(title: 'AUTH_REQUIRED - activite indisponible', detail: 'Cette Preview ne fabrique ni transactions, ni soldes. Une session est necessaire avant toute lecture API autorisee.', icon: Icons.lock_outline),
        SectionTitle('Control Center'),
        InfoCard(title: 'Statut des services', detail: 'L etat operationnel doit provenir des endpoints existants, apres validation de leur contrat et de leur authentification.', icon: Icons.monitor_heart_outlined),
      ]);
}

class AccountPage extends StatelessWidget {
  const AccountPage({super.key});
  @override
  Widget build(BuildContext context) => PageFrame(children: const [
        SectionTitle('Compte'),
        InfoCard(title: 'Profil', detail: 'Aucun profil fictif n est affiche dans cette Preview.', icon: Icons.person_outline),
        InfoCard(title: 'Securite et session', detail: 'La session de production reste protegee par cookies HttpOnly. Aucun etat connecte n est simule.', icon: Icons.shield_outlined),
        SectionTitle('Privacy et Data'),
        LegalTile(label: 'Privacy Policy', icon: Icons.privacy_tip_outlined, path: '/legal/privacy'),
        LegalTile(label: 'Privacy Choices', icon: Icons.tune_outlined, path: '/legal/privacy'),
        LegalTile(label: 'Delete Account', icon: Icons.delete_outline, path: '/account/delete'),
        SectionTitle('Legal et Support'),
        LegalTile(label: 'Terms of Service', icon: Icons.description_outlined, path: '/legal/terms'),
        LegalTile(label: 'Help et Support', icon: Icons.support_agent_outlined, path: '/support'),
        LegalTile(label: 'Contact', icon: Icons.mail_outline, path: '/support'),
        LegalTile(label: 'Security', icon: Icons.shield_outlined, path: '/support'),
      ]);
}

class BrandHero extends StatelessWidget {
  const BrandHero({super.key});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(color: _ink, borderRadius: BorderRadius.circular(20), border: Border.all(color: _gold)),
        child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Enterprise Payment Rail', style: TextStyle(color: Colors.white, fontSize: 25, fontWeight: FontWeight.w800)),
          SizedBox(height: 8),
          Text('Mobile Control Center pour les rails, le voyage et les operations.', style: TextStyle(color: Color(0xffd8d8db), height: 1.4)),
          SizedBox(height: 16),
          Chip(label: Text('PREVIEW - AUCUNE EXECUTION'), backgroundColor: Color(0xfffff6dc)),
        ]),
      );
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) => Padding(padding: const EdgeInsets.only(top: 24, bottom: 10), child: Text(text, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)));
}

class Notice extends StatelessWidget {
  const Notice(this.title, this.detail, {super.key});
  final String title;
  final String detail;
  @override
  Widget build(BuildContext context) => Card(color: const Color(0xfffff8e7), child: ListTile(leading: const Icon(Icons.info_outline, color: Color(0xff8c6100)), title: Text(title, style: const TextStyle(fontWeight: FontWeight.w800)), subtitle: Text(detail)));
}

class InfoCard extends StatelessWidget {
  const InfoCard({super.key, required this.title, required this.detail, required this.icon});
  final String title;
  final String detail;
  final IconData icon;
  @override
  Widget build(BuildContext context) => Card(child: Padding(padding: const EdgeInsets.all(16), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(icon, color: _gold), const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(fontWeight: FontWeight.w800)), const SizedBox(height: 4), Text(detail, style: const TextStyle(height: 1.35))]))])));
}

class QuickAction extends StatelessWidget {
  const QuickAction(this.icon, this.label, {super.key, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => SizedBox(width: 155, child: Semantics(button: true, label: label, child: Card(child: InkWell(borderRadius: BorderRadius.circular(12), onTap: onTap, child: Padding(padding: const EdgeInsets.all(14), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(icon, color: _gold), const SizedBox(height: 12), Text(label, style: const TextStyle(fontWeight: FontWeight.w700))]))))));
}

class RailGrid extends StatelessWidget {
  const RailGrid({super.key});
  static const rails = ['Stripe', 'Apple Pay', 'PayPal', 'Pix', 'PawaPay', 'Orange Money', 'MTN MoMo', 'M-Pesa', 'Campost', 'SEPA', 'SWIFT', 'Interac'];
  @override
  Widget build(BuildContext context) => GridView.count(crossAxisCount: 2, childAspectRatio: 2.3, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), mainAxisSpacing: 8, crossAxisSpacing: 8, children: rails.map((rail) => Card(child: Center(child: Text(rail, style: const TextStyle(fontWeight: FontWeight.w700))))).toList());
}

class LegalTile extends StatelessWidget {
  const LegalTile({super.key, required this.label, required this.icon, required this.path});
  final String label;
  final IconData icon;
  final String path;
  static Uri canonicalUrl(String path) => Uri.parse('https://smith-heffa-paygate.ca$path');
  Future<void> _open() async {
    final url = canonicalUrl(path);
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) throw Exception('Could not open $url');
  }
  @override
  Widget build(BuildContext context) => Semantics(link: true, label: '$label ouvre ${canonicalUrl(path)}', child: Card(child: ListTile(leading: Icon(icon), title: Text(label), trailing: const Icon(Icons.open_in_new), onTap: _open)));
}

class CompactLegalFooter extends StatelessWidget {
  const CompactLegalFooter({super.key});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: _ink, borderRadius: BorderRadius.circular(16)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
          Text('Legal et Support', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
          SizedBox(height: 6),
          Wrap(spacing: 4, runSpacing: 2, children: [
            FooterLink('Privacy', '/legal/privacy'),
            FooterLink('Terms', '/legal/terms'),
            FooterLink('Support', '/support'),
            FooterLink('Delete Account', '/account/delete'),
          ]),
          SizedBox(height: 10),
          Text('© Buttertech Inc.', style: TextStyle(color: Color(0xffc6a85b), fontSize: 11)),
        ]),
      );
}

class FooterLink extends StatelessWidget {
  const FooterLink(this.label, this.path, {super.key});
  final String label;
  final String path;
  Future<void> _open() async {
    final url = Uri.parse('https://smith-heffa-paygate.ca$path');
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) throw Exception('Could not open $url');
  }
  @override
  Widget build(BuildContext context) => TextButton(
        onPressed: _open,
        style: TextButton.styleFrom(foregroundColor: const Color(0xffd8d8db), padding: const EdgeInsets.symmetric(horizontal: 4)),
        child: Text(label, style: const TextStyle(fontSize: 12)),
      );
}
