import SwiftUI
import MapKit
import CoreLocation

/// Full-screen map with a persistent bottom sheet — map-first, iPhone-only.
struct ContentView: View {
    @StateObject private var store = RestroomStore()
    @StateObject private var location = LocationManager()

    @State private var query = ""
    @State private var accessFilter: Access?
    @State private var selectedID: String?
    @State private var showSheet = true
    @State private var cameraPosition: MapCameraPosition = .region(
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 40.7549, longitude: -73.9840),
            span: MKCoordinateSpan(latitudeDelta: 0.10, longitudeDelta: 0.10)
        )
    )

    private var filtered: [Restroom] {
        filterRestrooms(store.restrooms, query: query, access: accessFilter, userLocation: location.location)
    }

    var body: some View {
        Map(position: $cameraPosition, selection: $selectedID) {
            UserAnnotation()
            ForEach(filtered) { spot in
                Marker(spot.name, systemImage: spot.access.markerSymbol, coordinate: spot.coordinate)
                    .tint(spot.access.color)
                    .tag(spot.id)
            }
        }
        .mapStyle(.standard(pointsOfInterest: .excludingAll))
        .mapControls {
            MapUserLocationButton()
            MapCompass()
        }
        .ignoresSafeArea(.all, edges: .top)
        .onChange(of: selectedID) { _, id in focus(on: id) }
        .onChange(of: location.location) { _, coord in
            // On first location fix, frame the nearest result.
            guard let coord, let nearest = filtered.first else { return }
            withAnimation {
                cameraPosition = .region(regionSpanning(coord, nearest.coordinate))
            }
        }
        .sheet(isPresented: $showSheet) {
            SheetView(
                store: store,
                location: location,
                query: $query,
                accessFilter: $accessFilter,
                selectedID: $selectedID
            )
            .presentationDetents([.height(110), .medium, .large])
            .presentationBackgroundInteraction(.enabled(upThrough: .medium))
            .presentationBackground(.regularMaterial)
            .presentationDragIndicator(.visible)
            .interactiveDismissDisabled()
        }
    }

    private func focus(on id: String?) {
        guard let id, let spot = store.restrooms.first(where: { $0.id == id }) else { return }
        withAnimation {
            cameraPosition = .region(
                MKCoordinateRegion(
                    center: spot.coordinate,
                    span: MKCoordinateSpan(latitudeDelta: 0.012, longitudeDelta: 0.012)
                )
            )
        }
    }

    private func regionSpanning(_ a: CLLocationCoordinate2D, _ b: CLLocationCoordinate2D) -> MKCoordinateRegion {
        let center = CLLocationCoordinate2D(latitude: (a.latitude + b.latitude) / 2,
                                            longitude: (a.longitude + b.longitude) / 2)
        let span = MKCoordinateSpan(
            latitudeDelta: max(0.01, abs(a.latitude - b.latitude) * 2.2),
            longitudeDelta: max(0.01, abs(a.longitude - b.longitude) * 2.2)
        )
        return MKCoordinateRegion(center: center, span: span)
    }
}

#Preview {
    ContentView()
}
