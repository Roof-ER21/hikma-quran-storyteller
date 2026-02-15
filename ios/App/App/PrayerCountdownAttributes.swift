//
//  PrayerCountdownAttributes.swift
//  Shared between App and PrayerCountdownWidget targets
//
//  Defines the ActivityAttributes for prayer time Live Activities
//

import ActivityKit
import Foundation

struct PrayerCountdownAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var prayerName: String
        var prayerNameArabic: String
        var prayerTime: Date
        var nextPrayerName: String
        var nextPrayerTime: Date
    }

    var startedAt: Date
}
