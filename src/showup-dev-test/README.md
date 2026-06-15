# Show Up Room Frontend Developer Test

This folder contains the current `ShowUp.jsx` component from Phasr.

## Product Context

Phasr has a feature called **Show Up rooms**. A user joins a focus room such as Health & Fitness, checks in for the day, sees who else is live, posts to the room feed, and tracks rank/streaks in Stacks.

The important tabs are:
- **Live**: checked-in members, check-in time, Mark Done button, user card with photo and bio.
- **Feed**: room feed posts, likes, comments, nudges.
- **Stacks**: rank/leaderboard based on streak and activity.

## Current Issue

When the user taps **Check In**, their profile card appears for a second, then disappears after the member refresh runs. The UI sometimes shows:

`Could not load room members from Supabase.`

That error should not be visible to the user.

## Desired Live Tab Behavior

After check-in, Live should look like this:

- Top action row:
  - Left button: `Checked in 02:13 PM`
  - Right button: `Mark Done`
- Below that:
  - User card with circular profile photo
  - Name: `You`
  - User bio text
  - Tapping the image opens the full image
- Sub-rooms section:
  - Label: `SUB-ROOMS`
  - `+ Create` button

The user card must stay visible after check-in. It must not disappear when Supabase refreshes.

## Data Requirements

Room members and feed posts should sync with Supabase:
- `show_up_checkins`
- `room_feed_posts`

Real-time subscriptions should update Live and Feed, but failed/slow refreshes should not remove the current user’s checked-in card.

## What We Want From You

Please review `ShowUp.jsx` and propose or implement a cleaner frontend fix for:

1. Keeping the checked-in user card stable in Live.
2. Hiding Supabase technical errors from the UI.
3. Keeping the Mark Done button visible only for the current user.
4. Making Feed and Stacks continue working while Supabase data refreshes.
5. Improving the structure if the current component is too tangled.

You can return:
- a patched `ShowUp.jsx`,
- a diff/patch file,
- or a written explanation with the exact code changes you recommend.

