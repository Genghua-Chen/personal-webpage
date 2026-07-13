import SwiftUI
import MapKit
import CoreLocation

/// One card in the list. Tap-to-copy door code + Apple Maps walking directions.
struct RestroomRow: View {
    let restroom: Restroom
    let userLocation: CLLocationCoordinate2D?
    let selected: Bool

    @State private var copied = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top, spacing: 10) {
                Text(restroom.categoryEmoji).font(.title3)
                VStack(alignment: .leading, spacing: 2) {
                    Text(restroom.name).font(.body.weight(.semibold))
                    Text(restroom.address).font(.caption).foregroundStyle(.secondary)
                }
                Spacer(minLength: 6)
                if let me = userLocation {
                    let d = distanceMeters(me, restroom.coordinate)
                    VStack(alignment: .trailing, spacing: 1) {
                        Text(formatDistance(d)).font(.subheadline.weight(.bold)).foregroundStyle(.tint)
                        Text("~\(walkMinutes(d)) min").font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }

            HStack(spacing: 6) {
                Badge(text: "\(restroom.access.emoji) \(restroom.access.label)", tint: restroom.access.color)
                Badge(text: "\(restroom.categoryEmoji) \(restroom.categoryLabel)", tint: .secondary)
                Badge(text: "📍 \(restroom.neighborhood)", tint: .secondary)
            }

            if !restroom.notes.isEmpty {
                Text(restroom.notes).font(.caption).foregroundStyle(.secondary)
            }

            HStack(spacing: 8) {
                if !restroom.password.isEmpty {
                    Button {
                        UIPasteboard.general.string = restroom.password
                        copied = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.1) { copied = false }
                    } label: {
                        Label(copied ? "Copied ✓" : "🔑 \(restroom.password)",
                              systemImage: copied ? "checkmark" : "doc.on.doc")
                            .font(.subheadline.weight(.bold))
                            .monospaced()
                    }
                    .buttonStyle(.bordered)
                    .tint(Access.fixed_code.color)
                }

                Button {
                    openDirections()
                } label: {
                    Label("Directions", systemImage: "location.north.line.fill")
                        .font(.subheadline.weight(.semibold))
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(12)
        .background(
            selected ? Color.accentColor.opacity(0.12) : Color(.secondarySystemBackground),
            in: RoundedRectangle(cornerRadius: 14)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(selected ? Color.accentColor : .clear, lineWidth: 1.5)
        )
        .overlay(alignment: .leading) {
            RoundedRectangle(cornerRadius: 2)
                .fill(restroom.access.color)
                .frame(width: 4)
                .padding(.vertical, 10)
        }
    }

    private func openDirections() {
        let item = MKMapItem(placemark: MKPlacemark(coordinate: restroom.coordinate))
        item.name = restroom.name
        item.openInMaps(launchOptions: [MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeWalking])
    }
}

struct Badge: View {
    let text: String
    let tint: Color

    var body: some View {
        Text(text)
            .font(.caption2.weight(.semibold))
            .lineLimit(1)
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(tint.opacity(0.15), in: RoundedRectangle(cornerRadius: 6))
            .foregroundStyle(tint)
    }
}
