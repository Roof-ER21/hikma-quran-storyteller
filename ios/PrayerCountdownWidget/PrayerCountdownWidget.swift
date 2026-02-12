//
//  PrayerCountdownWidget.swift
//  PrayerCountdownWidget
//
//  Live Activity showing prayer time countdown on iOS Lock Screen
//

import ActivityKit
import WidgetKit
import SwiftUI

// MARK: - Activity Attributes

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

// MARK: - Live Activity Widget

@available(iOS 16.2, *)
struct PrayerCountdownLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PrayerCountdownAttributes.self) { context in
            // Lock Screen / Banner UI
            LockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded Region
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 4) {
                        Image(systemName: "moon.stars.fill")
                            .foregroundColor(.purple)
                        Text(context.state.prayerNameArabic)
                            .font(.system(size: 16, weight: .bold))
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.prayerTime, style: .timer)
                        .font(.system(size: 16, weight: .semibold, design: .monospaced))
                        .foregroundColor(.orange)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Text("Next: \(context.state.nextPrayerName)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(context.state.nextPrayerTime, style: .time)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal, 4)
                }
            } compactLeading: {
                Image(systemName: "moon.stars.fill")
                    .foregroundColor(.purple)
            } compactTrailing: {
                Text(context.state.prayerTime, style: .timer)
                    .font(.system(size: 12, weight: .semibold, design: .monospaced))
                    .foregroundColor(.orange)
            } minimal: {
                Image(systemName: "moon.stars.fill")
                    .foregroundColor(.purple)
            }
        }
    }
}

// MARK: - Lock Screen View

@available(iOS 16.2, *)
struct LockScreenView: View {
    let context: ActivityViewContext<PrayerCountdownAttributes>

    var body: some View {
        HStack(spacing: 16) {
            // Prayer icon and name
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Image(systemName: prayerIcon(context.state.prayerName))
                        .font(.system(size: 20))
                        .foregroundColor(.white)
                    Text(context.state.prayerName)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.white)
                }
                Text(context.state.prayerNameArabic)
                    .font(.system(size: 14))
                    .foregroundColor(.white.opacity(0.8))
            }

            Spacer()

            // Countdown timer
            VStack(alignment: .trailing, spacing: 4) {
                Text(context.state.prayerTime, style: .timer)
                    .font(.system(size: 24, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
                Text("until \(context.state.prayerName)")
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.7))
            }
        }
        .padding(16)
        .background(
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.13, green: 0.0, blue: 0.21),
                    Color(red: 0.33, green: 0.0, blue: 0.33)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
    }

    func prayerIcon(_ name: String) -> String {
        switch name.lowercased() {
        case "fajr": return "sunrise.fill"
        case "dhuhr": return "sun.max.fill"
        case "asr": return "sun.haze.fill"
        case "maghrib": return "sunset.fill"
        case "isha": return "moon.stars.fill"
        default: return "clock.fill"
        }
    }
}
