import Foundation
import CoreLocation

/// Straight-line distance in meters between two coordinates.
func distanceMeters(_ a: CLLocationCoordinate2D, _ b: CLLocationCoordinate2D) -> Double {
    CLLocation(latitude: a.latitude, longitude: a.longitude)
        .distance(from: CLLocation(latitude: b.latitude, longitude: b.longitude))
}

func formatDistance(_ meters: Double) -> String {
    let miles = meters / 1609.34
    return miles < 0.1 ? "\(Int(meters.rounded())) m" : String(format: "%.1f mi", miles)
}

/// ~80 m/min walking pace, at least 1 minute.
func walkMinutes(_ meters: Double) -> Int {
    max(1, Int((meters / 80).rounded()))
}

/// Shared filtering + distance sort used by both the map and the list.
func filterRestrooms(_ all: [Restroom],
                     query: String,
                     access: Access?,
                     userLocation: CLLocationCoordinate2D?) -> [Restroom] {
    let q = query.trimmingCharacters(in: .whitespaces).lowercased()
    var list = all.filter { r in
        if let access, r.access != access { return false }
        if !q.isEmpty {
            let hay = "\(r.name) \(r.neighborhood) \(r.address) \(r.categoryLabel)".lowercased()
            if !hay.contains(q) { return false }
        }
        return true
    }
    if let me = userLocation {
        list.sort { distanceMeters(me, $0.coordinate) < distanceMeters(me, $1.coordinate) }
    }
    return list
}
