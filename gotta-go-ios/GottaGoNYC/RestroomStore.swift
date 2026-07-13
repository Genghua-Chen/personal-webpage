import Foundation

/// Loads and parses restrooms.csv from the app bundle.
@MainActor
final class RestroomStore: ObservableObject {
    @Published var restrooms: [Restroom] = []

    init() { load() }

    func load() {
        guard let url = Bundle.main.url(forResource: "restrooms", withExtension: "csv"),
              let text = try? String(contentsOf: url, encoding: .utf8) else {
            assertionFailure("restrooms.csv missing from the app bundle")
            return
        }
        restrooms = Self.parse(text)
    }

    var freeCount: Int { restrooms.filter { $0.access == .free }.count }
    var codedCount: Int { restrooms.filter { !$0.password.isEmpty }.count }

    /// RFC-4180-ish CSV parse that handles quoted fields and escaped quotes.
    static func parse(_ text: String) -> [Restroom] {
        var rows: [[String]] = []
        var row: [String] = []
        var field = ""
        var inQuotes = false
        let chars = Array(text)
        var i = 0
        while i < chars.count {
            let c = chars[i]
            if inQuotes {
                if c == "\"" {
                    if i + 1 < chars.count && chars[i + 1] == "\"" { field.append("\""); i += 1 }
                    else { inQuotes = false }
                } else {
                    field.append(c)
                }
            } else if c == "\"" {
                inQuotes = true
            } else if c == "," {
                row.append(field); field = ""
            } else if c == "\n" || c == "\r" {
                if c == "\r" && i + 1 < chars.count && chars[i + 1] == "\n" { i += 1 }
                if !field.isEmpty || !row.isEmpty { row.append(field); rows.append(row); row = []; field = "" }
            } else {
                field.append(c)
            }
            i += 1
        }
        if !field.isEmpty || !row.isEmpty { row.append(field); rows.append(row) }
        guard rows.count > 1 else { return [] }

        let header = rows[0].map { $0.trimmingCharacters(in: .whitespaces) }
        func col(_ key: String) -> Int { header.firstIndex(of: key) ?? -1 }
        let iId = col("id"), iName = col("name"), iCat = col("category"), iAccess = col("access")
        let iPass = col("password"), iCost = col("cost"), iAddr = col("address")
        let iHood = col("neighborhood"), iBoro = col("borough")
        let iLat = col("lat"), iLng = col("lng"), iNotes = col("notes")

        var out: [Restroom] = []
        for r in rows.dropFirst() {
            func g(_ n: Int) -> String { (n >= 0 && n < r.count) ? r[n].trimmingCharacters(in: .whitespaces) : "" }
            guard let lat = Double(g(iLat)), let lng = Double(g(iLng)), !g(iId).isEmpty else { continue }
            out.append(Restroom(
                id: g(iId),
                name: g(iName),
                category: g(iCat),
                access: Access(rawValue: g(iAccess)) ?? .free,
                password: g(iPass),
                cost: g(iCost),
                address: g(iAddr),
                neighborhood: g(iHood),
                borough: g(iBoro),
                lat: lat,
                lng: lng,
                notes: g(iNotes)
            ))
        }
        return out
    }
}
