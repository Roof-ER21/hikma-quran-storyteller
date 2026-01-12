#!/usr/bin/env python3
"""
Download Full Quran Audio Script
Downloads all 6,236 verses for 3 reciters from Islamic Network CDN
"""

import os
import sys
import asyncio
import aiohttp
from pathlib import Path
from typing import List, Tuple
import time

# Verse counts for all 114 surahs (same as prebake-audio.mjs)
VERSE_COUNTS = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109,
    123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
    112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
    34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
    54, 53, 89, 59, 37, 35, 38, 29, 18, 45,
    60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
    14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
    28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
    29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
    15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
    11, 8, 3, 9, 5, 4, 7, 3, 6, 3,
    5, 4, 5, 6
]

# Reciters to download (removed ar.minshawimujawwad - CDN doesn't have full coverage)
RECITERS = [
    'ar.alafasy',
    'ar.husary'
]

# Base URL for Islamic Network CDN
BASE_URL = 'https://cdn.islamic.network/quran/audio/128'

# Base directory for downloads
BASE_DIR = Path('/Users/a21/Downloads/hikma_-quran-storyteller/public/assets/quran/offline')

# Concurrent download limit
MAX_CONCURRENT = 8

# Delay between requests (seconds)
REQUEST_DELAY = 0.1


class QuranDownloader:
    def __init__(self):
        self.session = None
        self.total_downloaded = 0
        self.total_skipped = 0
        self.total_failed = 0
        self.semaphore = asyncio.Semaphore(MAX_CONCURRENT)

    async def create_session(self):
        """Create aiohttp session with timeout"""
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(timeout=timeout)

    async def close_session(self):
        """Close aiohttp session"""
        if self.session:
            await self.session.close()

    def calculate_global_verse_number(self, surah_num: int, verse_num: int) -> int:
        """Calculate global verse number (1-6236) from surah and verse"""
        # Sum all verses before this surah
        verses_before = sum(VERSE_COUNTS[:surah_num - 1])
        # Add current verse number
        return verses_before + verse_num

    def get_download_path(self, reciter: str, surah_num: int, verse_num: int) -> Path:
        """Get the file path for a verse"""
        return BASE_DIR / reciter / str(surah_num) / f"{verse_num}.mp3"

    async def download_verse(
        self,
        reciter: str,
        surah_num: int,
        verse_num: int,
        global_verse_num: int
    ) -> Tuple[bool, str]:
        """
        Download a single verse
        Returns: (success: bool, message: str)
        """
        async with self.semaphore:
            # Check if file already exists
            file_path = self.get_download_path(reciter, surah_num, verse_num)

            if file_path.exists():
                return True, "skipped"

            # Create directory if it doesn't exist
            file_path.parent.mkdir(parents=True, exist_ok=True)

            # Construct URL
            url = f"{BASE_URL}/{reciter}/{global_verse_num}.mp3"

            try:
                # Add small delay to avoid overwhelming CDN
                await asyncio.sleep(REQUEST_DELAY)

                async with self.session.get(url) as response:
                    if response.status == 200:
                        content = await response.read()

                        # Write to file
                        with open(file_path, 'wb') as f:
                            f.write(content)

                        return True, "downloaded"
                    else:
                        return False, f"HTTP {response.status}"

            except asyncio.TimeoutError:
                return False, "timeout"
            except Exception as e:
                return False, str(e)

    async def download_surah(self, reciter: str, surah_num: int) -> dict:
        """Download all verses of a surah for a reciter"""
        verse_count = VERSE_COUNTS[surah_num - 1]

        tasks = []
        for verse_num in range(1, verse_count + 1):
            global_verse_num = self.calculate_global_verse_number(surah_num, verse_num)
            task = self.download_verse(reciter, surah_num, verse_num, global_verse_num)
            tasks.append(task)

        results = await asyncio.gather(*tasks)

        # Count results
        downloaded = sum(1 for success, msg in results if success and msg == "downloaded")
        skipped = sum(1 for success, msg in results if success and msg == "skipped")
        failed = sum(1 for success, msg in results if not success)

        return {
            'downloaded': downloaded,
            'skipped': skipped,
            'failed': failed,
            'total': verse_count
        }

    async def download_all(self):
        """Download all surahs for all reciters"""
        print("🕌 Quran Audio Downloader")
        print("=" * 60)
        print(f"Reciters: {', '.join(RECITERS)}")
        print(f"Surahs: 114")
        print(f"Total verses: {sum(VERSE_COUNTS)}")
        print(f"Max concurrent downloads: {MAX_CONCURRENT}")
        print("=" * 60)
        print()

        await self.create_session()

        start_time = time.time()

        try:
            for reciter_idx, reciter in enumerate(RECITERS, 1):
                print(f"\n📖 Reciter {reciter_idx}/{len(RECITERS)}: {reciter}")
                print("-" * 60)

                for surah_num in range(1, 115):
                    surah_start = time.time()

                    result = await self.download_surah(reciter, surah_num)

                    surah_time = time.time() - surah_start

                    # Update totals
                    self.total_downloaded += result['downloaded']
                    self.total_skipped += result['skipped']
                    self.total_failed += result['failed']

                    # Progress indicator
                    status_emoji = "✅" if result['failed'] == 0 else "⚠️"
                    print(
                        f"{status_emoji} Surah {surah_num:3d} ({result['total']:3d} verses) | "
                        f"Downloaded: {result['downloaded']:3d} | "
                        f"Skipped: {result['skipped']:3d} | "
                        f"Failed: {result['failed']:3d} | "
                        f"Time: {surah_time:.1f}s"
                    )

                    # If too many failures, pause
                    if result['failed'] > result['total'] * 0.5:
                        print("⚠️  Too many failures detected. Pausing for 5 seconds...")
                        await asyncio.sleep(5)

        finally:
            await self.close_session()

        # Final summary
        elapsed_time = time.time() - start_time
        total_verses = sum(VERSE_COUNTS) * len(RECITERS)

        print("\n" + "=" * 60)
        print("📊 Download Summary")
        print("=" * 60)
        print(f"✅ Downloaded: {self.total_downloaded:,}")
        print(f"⏭️  Skipped:    {self.total_skipped:,}")
        print(f"❌ Failed:     {self.total_failed:,}")
        print(f"📦 Total:      {total_verses:,}")
        print(f"⏱️  Time:       {elapsed_time:.1f}s ({elapsed_time/60:.1f} minutes)")

        if self.total_downloaded > 0:
            avg_time = elapsed_time / self.total_downloaded
            print(f"⚡ Avg speed:  {avg_time:.2f}s per file")

        success_rate = (self.total_downloaded + self.total_skipped) / total_verses * 100
        print(f"✨ Success:    {success_rate:.1f}%")
        print("=" * 60)

        if self.total_failed > 0:
            print(f"\n⚠️  {self.total_failed} files failed to download.")
            print("You can re-run this script to retry failed downloads.")


async def main():
    """Main entry point"""
    downloader = QuranDownloader()

    try:
        await downloader.download_all()
    except KeyboardInterrupt:
        print("\n\n⚠️  Download interrupted by user")
        print(f"Downloaded: {downloader.total_downloaded}")
        print(f"Skipped: {downloader.total_skipped}")
        print(f"Failed: {downloader.total_failed}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    # Check Python version
    if sys.version_info < (3, 7):
        print("❌ This script requires Python 3.7 or higher")
        sys.exit(1)

    # Run async main
    asyncio.run(main())
