//
//  PrayerActivityPlugin.swift
//  App
//
//  Capacitor plugin bridge for managing prayer time Live Activities
//  Add this file to the main App target in Xcode (NOT the widget extension)
//

import Foundation
import Capacitor
import ActivityKit

@available(iOS 16.1, *)
@objc(PrayerActivityPlugin)
public class PrayerActivityPlugin: CAPPlugin {
    private var currentActivity: Activity<PrayerCountdownAttributes>?

    @objc func start(_ call: CAPPluginCall) {
        guard let prayerName = call.getString("prayerName"),
              let prayerNameArabic = call.getString("prayerNameArabic"),
              let prayerTimeStr = call.getString("prayerTime"),
              let nextPrayerName = call.getString("nextPrayerName"),
              let nextPrayerTimeStr = call.getString("nextPrayerTime") else {
            call.reject("Missing required parameters")
            return
        }

        let formatter = ISO8601DateFormatter()
        guard let prayerTime = formatter.date(from: prayerTimeStr),
              let nextPrayerTime = formatter.date(from: nextPrayerTimeStr) else {
            call.reject("Invalid date format. Use ISO 8601 format.")
            return
        }

        let attributes = PrayerCountdownAttributes(startedAt: Date())
        let contentState = PrayerCountdownAttributes.ContentState(
            prayerName: prayerName,
            prayerNameArabic: prayerNameArabic,
            prayerTime: prayerTime,
            nextPrayerName: nextPrayerName,
            nextPrayerTime: nextPrayerTime
        )

        do {
            let activity = try Activity.request(
                attributes: attributes,
                contentState: contentState,
                pushType: nil
            )
            currentActivity = activity
            call.resolve(["activityId": activity.id])
        } catch {
            call.reject("Failed to start activity: \(error.localizedDescription)")
        }
    }

    @objc func update(_ call: CAPPluginCall) {
        guard let activity = currentActivity else {
            call.reject("No active activity found")
            return
        }

        guard let prayerName = call.getString("prayerName"),
              let prayerNameArabic = call.getString("prayerNameArabic"),
              let prayerTimeStr = call.getString("prayerTime"),
              let nextPrayerName = call.getString("nextPrayerName"),
              let nextPrayerTimeStr = call.getString("nextPrayerTime") else {
            call.reject("Missing required parameters")
            return
        }

        let formatter = ISO8601DateFormatter()
        guard let prayerTime = formatter.date(from: prayerTimeStr),
              let nextPrayerTime = formatter.date(from: nextPrayerTimeStr) else {
            call.reject("Invalid date format. Use ISO 8601 format.")
            return
        }

        let contentState = PrayerCountdownAttributes.ContentState(
            prayerName: prayerName,
            prayerNameArabic: prayerNameArabic,
            prayerTime: prayerTime,
            nextPrayerName: nextPrayerName,
            nextPrayerTime: nextPrayerTime
        )

        Task {
            await activity.update(using: contentState)
            call.resolve()
        }
    }

    @objc func end(_ call: CAPPluginCall) {
        guard let activity = currentActivity else {
            call.reject("No active activity found")
            return
        }

        Task {
            await activity.end(dismissalPolicy: .immediate)
            currentActivity = nil
            call.resolve()
        }
    }

    @objc func endAll(_ call: CAPPluginCall) {
        Task {
            for activity in Activity<PrayerCountdownAttributes>.activities {
                await activity.end(dismissalPolicy: .immediate)
            }
            currentActivity = nil
            call.resolve()
        }
    }
}
