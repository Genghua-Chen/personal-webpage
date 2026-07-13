import SwiftUI
import CoreLocation

/// How you get into the restroom. Mirrors the `access` column in restrooms.csv.
enum Access: String, CaseIterable, Identifiable {
    case free, fixed_code, receipt_code, ask_staff, seasonal

    var id: String { rawValue }

    var label: String {
        switch self {
        case .free: "Free"
        case .fixed_code: "Door code"
        case .receipt_code: "On receipt"
        case .ask_staff: "Ask staff"
        case .seasonal: "Seasonal"
        }
    }

    var emoji: String {
        switch self {
        case .free: "🆓"
        case .fixed_code: "🔑"
        case .receipt_code: "🧾"
        case .ask_staff: "👤"
        case .seasonal: "🎪"
        }
    }

    /// Same palette as the web app.
    var color: Color {
        switch self {
        case .free:         Color(red: 0.133, green: 0.773, blue: 0.369) // #22c55e
        case .fixed_code:   Color(red: 0.231, green: 0.510, blue: 0.965) // #3b82f6
        case .receipt_code: Color(red: 0.961, green: 0.620, blue: 0.043) // #f59e0b
        case .ask_staff:    Color(red: 0.655, green: 0.545, blue: 0.980) // #a78bfa
        case .seasonal:     Color(red: 0.925, green: 0.282, blue: 0.600) // #ec4899
        }
    }

    /// SF Symbol shown inside the map marker.
    var markerSymbol: String {
        switch self {
        case .free:         "checkmark.circle.fill"
        case .fixed_code:   "key.fill"
        case .receipt_code: "doc.text.fill"
        case .ask_staff:    "person.fill"
        case .seasonal:     "tent.fill"
        }
    }
}

struct CategoryInfo {
    let label: String
    let emoji: String
}

let CATEGORIES: [String: CategoryInfo] = [
    "fast_food":       .init(label: "Fast food",    emoji: "🍔"),
    "coffee":          .init(label: "Coffee",       emoji: "☕"),
    "dept_store":      .init(label: "Store",        emoji: "🛍️"),
    "mall":            .init(label: "Mall",         emoji: "🏬"),
    "grocery":         .init(label: "Grocery",      emoji: "🛒"),
    "food_court":      .init(label: "Food court",   emoji: "🍜"),
    "park":            .init(label: "Park",         emoji: "🌳"),
    "library":         .init(label: "Library",      emoji: "📚"),
    "transit":         .init(label: "Transit",      emoji: "🚉"),
    "museum":          .init(label: "Museum",       emoji: "🖼️"),
    "business_center": .init(label: "Business ctr", emoji: "🏢"),
    "market":          .init(label: "Market",       emoji: "🎪"),
]

func categoryInfo(_ key: String) -> CategoryInfo {
    CATEGORIES[key] ?? CategoryInfo(label: key, emoji: "📍")
}

struct Restroom: Identifiable, Hashable {
    let id: String
    let name: String
    let category: String
    let access: Access
    let password: String
    let cost: String
    let address: String
    let neighborhood: String
    let borough: String
    let lat: Double
    let lng: Double
    let notes: String

    var coordinate: CLLocationCoordinate2D { .init(latitude: lat, longitude: lng) }
    var categoryLabel: String { categoryInfo(category).label }
    var categoryEmoji: String { categoryInfo(category).emoji }

    static func == (lhs: Restroom, rhs: Restroom) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}
