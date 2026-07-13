import SwiftUI
import CoreLocation

/// Bottom-sheet contents: brand row, search, filter chips, "nearest", and the list.
struct SheetView: View {
    @ObservedObject var store: RestroomStore
    @ObservedObject var location: LocationManager
    @Binding var query: String
    @Binding var accessFilter: Access?
    @Binding var selectedID: String?

    private var filtered: [Restroom] {
        filterRestrooms(store.restrooms, query: query, access: accessFilter, userLocation: location.location)
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            Divider()
            list
        }
    }

    private var header: some View {
        VStack(spacing: 12) {
            HStack(spacing: 8) {
                Text("🚽")
                Text("Gotta Go ")
                    .font(.title3.bold())
                + Text("NYC")
                    .font(.title3.bold())
                    .foregroundStyle(.tint)
                Spacer()
                Text("\(filtered.count) spots")
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(.secondary)
            }

            // Search
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
                TextField("Search name, neighborhood, address…", text: $query)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                if !query.isEmpty {
                    Button {
                        query = ""
                    } label: {
                        Image(systemName: "xmark.circle.fill").foregroundStyle(.secondary)
                    }
                }
            }
            .padding(10)
            .background(.quaternary.opacity(0.6), in: RoundedRectangle(cornerRadius: 12))

            // Nearest + access filters
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    Button {
                        location.request()
                    } label: {
                        Label(location.isLocating ? "Locating…" : "Nearest",
                              systemImage: "location.fill")
                            .font(.subheadline.weight(.semibold))
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
                    .disabled(location.isLocating)

                    FilterChip(title: "All", selected: accessFilter == nil) { accessFilter = nil }
                    ForEach(Access.allCases) { access in
                        FilterChip(title: "\(access.emoji) \(access.label)",
                                   tint: access.color,
                                   selected: accessFilter == access) {
                            accessFilter = (accessFilter == access) ? nil : access
                        }
                    }
                }
                .padding(.horizontal, 1)
            }
        }
        .padding(.horizontal)
        .padding(.top, 6)
        .padding(.bottom, 12)
    }

    private var list: some View {
        ScrollViewReader { proxy in
            List {
                if filtered.isEmpty {
                    Text("No restrooms match. Try clearing a filter. 🤷")
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.vertical, 40)
                        .listRowSeparator(.hidden)
                        .listRowBackground(Color.clear)
                }
                ForEach(filtered) { spot in
                    RestroomRow(restroom: spot,
                                userLocation: location.location,
                                selected: selectedID == spot.id)
                        .id(spot.id)
                        .listRowInsets(EdgeInsets(top: 5, leading: 14, bottom: 5, trailing: 14))
                        .listRowSeparator(.hidden)
                        .listRowBackground(Color.clear)
                        .contentShape(Rectangle())
                        .onTapGesture { selectedID = spot.id }
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .onChange(of: selectedID) { _, id in
                guard let id else { return }
                withAnimation { proxy.scrollTo(id, anchor: .top) }
            }
        }
    }
}

struct FilterChip: View {
    let title: String
    var tint: Color = .accentColor
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(selected ? tint.opacity(0.22) : Color(.tertiarySystemFill), in: Capsule())
                .overlay(Capsule().stroke(selected ? tint : .clear, lineWidth: 1))
                .foregroundStyle(selected ? Color.primary : Color.secondary)
        }
        .buttonStyle(.plain)
    }
}
