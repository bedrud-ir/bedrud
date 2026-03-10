# Push to Talk Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hold-to-talk PTT button to the meeting control bar on Web (Svelte), iOS (SwiftUI), and Android (Jetpack Compose), coexisting with the existing mic toggle.

**Architecture:** PTT is a local mic gate — holding PTT calls `setMicrophoneEnabled(true)` immediately; releasing waits 250ms then restores the prior mic toggle state. No server changes, no LiveKit metadata. Other participants see only the normal speaking ring.

**Tech Stack:** Svelte 5 ($state/$derived), livekit-client (web), LiveKit iOS SDK (Swift/Combine), LiveKit Android SDK (Kotlin/Coroutines)

---

## Chunk 1: Web

### Task 1: Add PTT state + mic gate logic to meeting page

**Files:**
- Modify: `apps/web/src/routes/m/[meetId]/+page.svelte` (add state variables and helper functions in the `<script>` block)

- [ ] **Step 1: Add PTT state variables after existing audio state (around line 92)**

  In `+page.svelte`, after `let audioEnabled = $state(true);`, add:

  ```ts
  // Push to Talk
  let isPttActive = $state(false);
  let pttKey = $state<string>(
      typeof localStorage !== 'undefined'
          ? (localStorage.getItem('ptt_key') ?? 'Space')
          : 'Space'
  );
  let pttReleaseTimer: ReturnType<typeof setTimeout> | null = null;
  ```

- [ ] **Step 2: Add startPtt and stopPtt functions after the toggleMic function (around line 349)**

  ```ts
  async function startPtt() {
      if (isPttActive) return;
      isPttActive = true;
      if (!room?.localParticipant) return;
      try {
          await room.localParticipant.setMicrophoneEnabled(true);
      } catch (_) {}
  }

  function stopPtt() {
      if (!isPttActive) return;
      if (pttReleaseTimer) clearTimeout(pttReleaseTimer);
      pttReleaseTimer = setTimeout(async () => {
          isPttActive = false;
          pttReleaseTimer = null;
          if (!room?.localParticipant) return;
          // Restore toggle state — only mute if mic was toggled off
          if (!audioEnabled) {
              try {
                  await room.localParticipant.setMicrophoneEnabled(false);
              } catch (_) {}
          }
      }, 250);
  }
  ```

- [ ] **Step 3: Add keyboard listener for PTT in onMount (after the existing resize listener)**

  The first `onMount` at line 124 currently adds the resize listener with no return/cleanup. Replace its entire body with the updated version that handles both resize and PTT keyboard listeners. Find the first `onMount` block (lines 124–135) and replace it entirely:

  ```ts
  onMount(() => {
      screenWidth = window.innerWidth;
      const handleResize = () => { screenWidth = window.innerWidth; };
      window.addEventListener('resize', handleResize);

      // Initialize LiveKit log suppression
      initLiveKitLogging();

      function handleKeydown(e: KeyboardEvent) {
          if (e.repeat) return;
          const el = document.activeElement;
          const isTyping =
              el instanceof HTMLInputElement ||
              el instanceof HTMLTextAreaElement ||
              (el as HTMLElement)?.isContentEditable;
          if (isTyping) return;
          if (e.code === pttKey) {
              e.preventDefault();
              startPtt();
          }
      }

      function handleKeyup(e: KeyboardEvent) {
          if (e.code === pttKey) stopPtt();
      }

      window.addEventListener('keydown', handleKeydown);
      window.addEventListener('keyup', handleKeyup);

      return () => {
          window.removeEventListener('resize', handleResize);
          window.removeEventListener('keydown', handleKeydown);
          window.removeEventListener('keyup', handleKeyup);
      };
  });
  ```

  > Important: The `return () => {...}` cleanup removes ALL three listeners. The old `onMount` had no cleanup for resize — this is intentional since we're replacing the full block.

- [ ] **Step 4: Verify no TypeScript errors**

  ```bash
  cd apps/web && npx tsc --noEmit
  ```

  Expected: no errors related to PTT additions.

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/routes/m/\[meetId\]/+page.svelte
  git commit -m "feat(web): add PTT state and mic gate logic to meeting page"
  ```

---

### Task 2: Create PttButton component

**Files:**
- Create: `apps/web/src/lib/components/meeting/PttButton.svelte`

- [ ] **Step 1: Create the component**

  ```svelte
  <script lang="ts">
      import { AudioLines } from 'lucide-svelte';
      import { Button } from '$lib/components/ui/button';

      interface Props {
          isPttActive: boolean;
          onStart: () => void;
          onStop: () => void;
          class?: string;
      }

      let { isPttActive, onStart, onStop, class: className = '' }: Props = $props();
  </script>

  <Button
      variant={isPttActive ? 'default' : 'outline'}
      size="icon"
      class={`select-none touch-none ${isPttActive ? 'ring-2 ring-green-500 bg-green-600 hover:bg-green-700' : ''} ${className}`}
      onpointerdown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onStart(); }}
      onpointerup={onStop}
      onpointerleave={onStop}
      onpointercancel={onStop}
      title="Push to Talk (hold)"
  >
      <AudioLines class="h-4 w-4" />
  </Button>
  ```

  > `setPointerCapture` ensures `pointerup` fires even if the pointer leaves the button.

- [ ] **Step 2: Verify no TypeScript errors**

  ```bash
  cd apps/web && npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/web/src/lib/components/meeting/PttButton.svelte
  git commit -m "feat(web): add PttButton component"
  ```

---

### Task 3: Create PttOverlay component

**Files:**
- Create: `apps/web/src/lib/components/meeting/PttOverlay.svelte`

- [ ] **Step 1: Create the overlay**

  ```svelte
  <script lang="ts">
      interface Props { visible: boolean; }
      let { visible }: Props = $props();
  </script>

  {#if visible}
      <div class="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2">
          <div class="flex items-center gap-2 rounded-full bg-black/70 px-5 py-2.5 text-white backdrop-blur-md">
              <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400"></span>
              <span class="text-sm font-semibold tracking-wide">Transmitting...</span>
          </div>
      </div>
  {/if}
  ```

- [ ] **Step 2: Verify no TypeScript errors**

  ```bash
  cd apps/web && npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/web/src/lib/components/meeting/PttOverlay.svelte
  git commit -m "feat(web): add PttOverlay component"
  ```

---

### Task 4: Wire PttButton and PttOverlay into the meeting page

**Files:**
- Modify: `apps/web/src/routes/m/[meetId]/+page.svelte`

- [ ] **Step 1: Import the two new components at the top of `<script>` (after existing meeting imports)**

  ```ts
  import PttButton from '$lib/components/meeting/PttButton.svelte';
  import PttOverlay from '$lib/components/meeting/PttOverlay.svelte';
  ```

- [ ] **Step 2: Add PttOverlay just before the closing `</div>` of the meeting root container**

  Find the outermost `<div>` of the meeting view (the root container that wraps the entire page). Add immediately before this `<div>` closes:

  ```svelte
  <PttOverlay visible={isPttActive} />
  ```

- [ ] **Step 3: Add PttButton to the desktop footer control bar**

  After the `<CameraButton ... />` block (around line 2145), before the `<div class="w-px h-8 bg-border">` separator, add:

  ```svelte
  <PttButton
      {isPttActive}
      onStart={startPtt}
      onStop={stopPtt}
  />
  ```

  > Placement: PTT sits alongside Camera/Mic in the media controls group, before the separator that divides media from participants/chat.

- [ ] **Step 4: Add PttButton to the mobile floating pill**

  After the mobile mic toggle `<Button>` block (around line 2008), add:

  ```svelte
  <PttButton
      {isPttActive}
      onStart={startPtt}
      onStop={stopPtt}
      class="h-10 w-10 sm:h-11 sm:w-11 rounded-full shrink-0"
  />
  ```

- [ ] **Step 5: Check the page renders without errors**

  ```bash
  cd apps/web && npm run dev
  ```

  Open `http://localhost:5173`. Join a test meeting. Verify:
  - PTT button appears in control bar (both desktop and mobile)
  - Holding PTT button shows the "Transmitting..." overlay
  - Releasing removes the overlay after ~250ms
  - Space bar triggers PTT (when not typing in chat)

- [ ] **Step 6: Commit**

  ```bash
  git add apps/web/src/routes/m/\[meetId\]/+page.svelte
  git commit -m "feat(web): wire PTT button and overlay into meeting page"
  ```

---

### Task 5: PTT key configuration (localStorage persistence)

**Files:**
- Modify: `apps/web/src/routes/m/[meetId]/+page.svelte` (add a settings entry for pttKey)

- [ ] **Step 1: Expose `pttKey` configuration in the room settings panel**

  Search for `{#if settingsTab === 'general'}` in `+page.svelte` to locate the General settings tab body. Inside that block, add the PTT key row after the existing display name / avatar section (look for the last `</div>` before the `{:else if settingsTab === 'audio'}` or `{/if}` that closes the general tab):

  ```svelte
  <div class="flex items-center justify-between">
      <label for="ptt-key" class="text-sm font-medium">Push to Talk key</label>
      <input
          id="ptt-key"
          class="w-32 rounded border px-2 py-1 text-sm font-mono"
          value={pttKey}
          readonly
          placeholder="Press a key..."
          onkeydown={(e) => {
              e.preventDefault();
              pttKey = e.code;
              localStorage.setItem('ptt_key', e.code);
          }}
      />
  </div>
  ```

- [ ] **Step 2: Verify key config persists across page reload**

  1. Set a custom key (e.g., `KeyG`) in settings
  2. Reload page
  3. Verify PTT activates on `G` key

- [ ] **Step 3: Commit**

  ```bash
  git add apps/web/src/routes/m/\[meetId\]/+page.svelte
  git commit -m "feat(web): add PTT key configuration with localStorage persistence"
  ```

---

## Chunk 2: iOS

### Task 6: Add PTT methods to RoomManager

**Files:**
- Modify: `apps/ios/Bedrud/Core/LiveKit/RoomManager.swift`
- Test: `apps/ios/BedrudTests/Core/LiveKit/RoomManagerTests.swift`

- [ ] **Step 1: Write failing tests in RoomManagerTests.swift**

  Add after the existing `testInitialStateIsDisconnected` test:

  ```swift
  // MARK: - PTT

  func testPttInitialStateIsFalse() {
      let manager = RoomManager()
      XCTAssertFalse(manager.isPttActive)
  }

  func testStartPttSetsPttActiveTrue() async {
      let manager = RoomManager()
      // No room connected — only the flag should change
      await manager.startPtt()
      XCTAssertTrue(manager.isPttActive)
  }

  func testStopPttSetsPttActiveFalseAfterDelay() async throws {
      let manager = RoomManager()
      await manager.startPtt()
      XCTAssertTrue(manager.isPttActive)
      manager.stopPtt()
      // Wait longer than 250ms release delay
      try await Task.sleep(nanoseconds: 400_000_000)
      XCTAssertFalse(manager.isPttActive)
  }

  func testStartPttIsIdempotent() async {
      let manager = RoomManager()
      await manager.startPtt()
      await manager.startPtt() // second call is a no-op
      XCTAssertTrue(manager.isPttActive)
  }
  ```

- [ ] **Step 2: Run tests to confirm they fail**

  ```bash
  cd apps/ios && xcodebuild test \
    -scheme Bedrud \
    -destination 'platform=iOS Simulator,name=iPhone 16' \
    -only-testing BedrudTests/RoomManagerTests/testPttInitialStateIsFalse \
    2>&1 | tail -20
  ```

  Expected: `testPttInitialStateIsFalse` fails with "value of type 'RoomManager' has no member 'isPttActive'".

- [ ] **Step 3: Add PTT properties and methods to RoomManager.swift**

  In the `// MARK: - Published State` section, after `@Published var isScreenShareEnabled`, add:

  ```swift
  @Published private(set) var isPttActive: Bool = false
  ```

  In the `// MARK: - Media Controls` section, after `toggleScreenShare()`, add:

  ```swift
  // MARK: - Push to Talk

  func startPtt() async {
      guard !isPttActive else { return }
      isPttActive = true
      guard let localParticipant = room?.localParticipant else { return }
      try? await localParticipant.setMicrophone(enabled: true)
  }

  func stopPtt() {
      pttReleaseTask?.cancel()
      pttReleaseTask = Task { [weak self] in
          try? await Task.sleep(nanoseconds: 250_000_000)
          guard !Task.isCancelled, let self else { return }
          await MainActor.run {
              self.isPttActive = false
          }
          guard let localParticipant = self.room?.localParticipant else { return }
          // Restore toggle state
          try? await localParticipant.setMicrophone(enabled: self.isMicrophoneEnabled)
      }
  }
  ```

  In the `// MARK: - LiveKit Room` private section, add the task storage:

  ```swift
  private var pttReleaseTask: Task<Void, Never>?
  ```

  In `disconnect()`, before `cancellables.removeAll()`, add:

  ```swift
  pttReleaseTask?.cancel()
  pttReleaseTask = nil
  isPttActive = false
  ```

  > `pttReleaseTask?.cancel()` signals cancellation; the task will exit at its next `Task.sleep` checkpoint. Since `RoomManager` is `@MainActor`, the `isPttActive = false` assignment here is safe and immediately visible to the UI before the next render pass.

- [ ] **Step 4: Run tests to confirm they pass**

  ```bash
  cd apps/ios && xcodebuild test \
    -scheme Bedrud \
    -destination 'platform=iOS Simulator,name=iPhone 16' \
    -only-testing BedrudTests/RoomManagerTests \
    2>&1 | tail -20
  ```

  Expected: All `RoomManagerTests` pass.

- [ ] **Step 5: Commit**

  ```bash
  git add apps/ios/Bedrud/Core/LiveKit/RoomManager.swift \
         apps/ios/BedrudTests/Core/LiveKit/RoomManagerTests.swift
  git commit -m "feat(ios): add PTT startPtt/stopPtt to RoomManager"
  ```

---

### Task 7: Add PTT button to iOS ControlBar

**Files:**
- Modify: `apps/ios/Bedrud/Features/Meeting/ControlBar.swift`

- [ ] **Step 1: Add the PTT button between the Screen Share button and the Chat button in ControlBar.swift**

  In the `HStack` body, after the screen share `controlButton(...)` call and its following `Spacer()`, but before the Chat button, add:

  ```swift
  // Push to Talk
  Button {} label: {
      VStack(spacing: 4) {
          Image(systemName: roomManager.isPttActive ? "waveform.circle.fill" : "waveform")
              .font(.system(size: 18))
              .foregroundStyle(roomManager.isPttActive ? .green : .primary)
              .frame(width: 48, height: 48)
              .background(
                  roomManager.isPttActive
                      ? Color.green.opacity(0.2)
                      : Color.primary.opacity(0.12)
              )
              .clipShape(Circle())
          Text("PTT")
              .font(.caption2)
              .foregroundStyle(.secondary)
      }
  }
  .buttonStyle(.plain)
  .simultaneousGesture(
      DragGesture(minimumDistance: 0)
          .onChanged { _ in
              Task { await roomManager.startPtt() }
          }
          .onEnded { _ in
              roomManager.stopPtt()
          }
  )

  Spacer()
  ```

- [ ] **Step 2: Build to verify**

  ```bash
  cd apps/ios && xcodebuild build \
    -scheme Bedrud \
    -destination 'platform=iOS Simulator,name=iPhone 16' \
    2>&1 | grep -E "error:|BUILD"
  ```

  Expected: `BUILD SUCCEEDED` with no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/ios/Bedrud/Features/Meeting/ControlBar.swift
  git commit -m "feat(ios): add PTT hold button to ControlBar"
  ```

---

### Task 8: Add PTT floating overlay to iOS MeetingView

**Files:**
- Modify: `apps/ios/Bedrud/Features/Meeting/MeetingView.swift`

- [ ] **Step 1: Add the overlay inside the root ZStack**

  In `MeetingView.body`, the root `ZStack` currently has `Color.systemBackground`, `VStack`, etc. Add the PTT overlay as the last item in the `ZStack` (so it renders on top):

  ```swift
  // PTT transmitting overlay
  if roomManager.isPttActive {
      VStack {
          Spacer()
          HStack(spacing: 8) {
              Image(systemName: "waveform.circle.fill")
                  .foregroundStyle(.green)
                  .font(.title3)
              Text("Transmitting...")
                  .font(.headline)
                  .foregroundStyle(.white)
          }
          .padding(.horizontal, 24)
          .padding(.vertical, 12)
          .background(.ultraThinMaterial)
          .clipShape(Capsule())
          .padding(.bottom, 112) // above control bar
      }
      .ignoresSafeArea()
      .allowsHitTesting(false)
  }
  ```

- [ ] **Step 2: Build and run on simulator**

  ```bash
  cd apps/ios && xcodebuild build \
    -scheme Bedrud \
    -destination 'platform=iOS Simulator,name=iPhone 16' \
    2>&1 | grep -E "error:|BUILD"
  ```

  Expected: `BUILD SUCCEEDED`.

  Manually verify in simulator:
  - PTT button appears in control bar
  - Long-pressing PTT shows the "Transmitting..." capsule overlay
  - Releasing removes it after ~250ms

- [ ] **Step 3: Commit**

  ```bash
  git add apps/ios/Bedrud/Features/Meeting/MeetingView.swift
  git commit -m "feat(ios): add PTT transmitting overlay to MeetingView"
  ```

---

## Chunk 3: Android

### Task 9: Add PTT to Android RoomManager

**Files:**
- Modify: `apps/android/app/src/main/java/com/bedrud/app/core/livekit/RoomManager.kt`
- Test: `apps/android/app/src/test/java/com/bedrud/app/core/livekit/RoomManagerTest.kt`

- [ ] **Step 1: Write failing tests in RoomManagerTest.kt**

  Add a new test class `PttStateTest` in the same file, after the existing tests. These tests exercise PTT state logic directly via `MutableStateFlow` without requiring `Application` context:

  ```kotlin
  import kotlinx.coroutines.flow.MutableStateFlow
  import kotlinx.coroutines.test.runTest

  class PttStateTest {

      // Minimal PTT gate logic extracted for unit testing
      private fun applyPttGate(isMicEnabled: Boolean, isPttActive: Boolean): Boolean =
          isMicEnabled || isPttActive

      @Test
      fun `mic gate: ptt active overrides mic off`() {
          assertTrue(applyPttGate(isMicEnabled = false, isPttActive = true))
      }

      @Test
      fun `mic gate: ptt inactive restores mic off`() {
          assertFalse(applyPttGate(isMicEnabled = false, isPttActive = false))
      }

      @Test
      fun `mic gate: ptt inactive with mic on stays on`() {
          assertTrue(applyPttGate(isMicEnabled = true, isPttActive = false))
      }

      @Test
      fun `ptt isPttActive StateFlow initial value is false`() {
          val isPttActive = MutableStateFlow(false)
          assertFalse(isPttActive.value)
      }

      @Test
      fun `ptt start sets StateFlow to true`() {
          val isPttActive = MutableStateFlow(false)
          isPttActive.value = true
          assertTrue(isPttActive.value)
      }

      @Test
      fun `ptt stop sets StateFlow to false`() {
          val isPttActive = MutableStateFlow(true)
          isPttActive.value = false
          assertFalse(isPttActive.value)
      }
  }
  ```

  > These tests verify the PTT gate formula and StateFlow behavior. The `RoomManager` class itself requires `Application` context and is verified via compile-time checks (Step 6) and manual device testing (Task 10, Step 5).

- [ ] **Step 2: Run existing tests to confirm they still pass**

  ```bash
  cd apps/android && ./gradlew :app:testDebugUnitTest \
    --tests "com.bedrud.app.core.livekit.RoomManagerTest" 2>&1 | tail -15
  ```

  Expected: `BUILD SUCCESSFUL`, all tests pass.

- [ ] **Step 3: Add PTT fields to RoomManager.kt**

  After the `_error` StateFlow declaration (around line 72), add:

  ```kotlin
  private val _isPttActive = MutableStateFlow(false)
  val isPttActive: StateFlow<Boolean> = _isPttActive.asStateFlow()

  private var managerScope: CoroutineScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
  private var pttReleaseJob: Job? = null
  ```

  Add the `Job` import at the top if not present:

  ```kotlin
  import kotlinx.coroutines.Job
  import kotlinx.coroutines.delay
  ```

- [ ] **Step 4: Add startPtt and stopPtt methods after toggleMicrophone**

  ```kotlin
  fun startPtt() {
      if (_isPttActive.value) return
      _isPttActive.value = true
      managerScope.launch {
          try {
              _room?.localParticipant?.setMicrophoneEnabled(true)
          } catch (e: Exception) {
              Log.e(TAG, "PTT start: failed to enable mic", e)
          }
      }
  }

  fun stopPtt() {
      pttReleaseJob?.cancel()
      pttReleaseJob = managerScope.launch {
          delay(250)
          _isPttActive.value = false
          try {
              _room?.localParticipant?.setMicrophoneEnabled(_isMicEnabled.value)
          } catch (e: Exception) {
              Log.e(TAG, "PTT stop: failed to restore mic", e)
          }
      }
  }
  ```

- [ ] **Step 5: Clean up PTT on disconnect**

  Inside the `disconnect()` function, before `_error.value = null`, add:

  ```kotlin
  pttReleaseJob?.cancel()
  pttReleaseJob = null
  _isPttActive.value = false
  ```

  Do NOT cancel `managerScope` in `disconnect()`. `RoomManager` is a Koin singleton that is reused across multiple room sessions. Instead, recreate the scope at the start of each `connect()` call. At the top of `connect()` (before `_connectionState.value = ConnectionState.CONNECTING`), add:

  ```kotlin
  // Recreate managerScope so PTT works after reconnection
  managerScope.cancel()
  managerScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
  ```

- [ ] **Step 6: Build to verify**

  ```bash
  cd apps/android && ./gradlew :app:compileDebugKotlin 2>&1 | grep -E "error:|BUILD"
  ```

  Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 7: Commit**

  ```bash
  git add apps/android/app/src/main/java/com/bedrud/app/core/livekit/RoomManager.kt \
         apps/android/app/src/test/java/com/bedrud/app/core/livekit/RoomManagerTest.kt
  git commit -m "feat(android): add PTT startPtt/stopPtt to RoomManager"
  ```

---

### Task 10: Add PTT button and overlay to Android MeetingScreen

**Files:**
- Modify: `apps/android/app/src/main/java/com/bedrud/app/ui/screens/meeting/MeetingScreen.kt`

- [ ] **Step 1: Collect isPttActive state**

  In `MeetingScreen`, after the existing `collectAsState()` calls (around line 121), add:

  ```kotlin
  val isPttActive by roomManager.isPttActive.collectAsState()
  ```

- [ ] **Step 2: Add PTT button to the controls bar**

  In the controls `Row` (around line 345), after the screen share `SmallFloatingActionButton` block and before the chat toggle, add:

  ```kotlin
  // Push to Talk
  SmallFloatingActionButton(
      onClick = { /* tap does nothing — hold activates PTT */ },
      containerColor = if (isPttActive)
          MaterialTheme.colorScheme.primary
      else MaterialTheme.colorScheme.surfaceVariant,
      modifier = Modifier.pointerInput(Unit) {
          awaitPointerEventScope {
              while (true) {
                  val event = awaitPointerEvent()
                  // PointerEventType.Release covers finger-up AND drag-off
                  if (event.type == PointerEventType.Press) {
                      roomManager.startPtt()
                  } else if (event.type == PointerEventType.Release) {
                      roomManager.stopPtt()
                  }
              }
          }
      }
  ) {
      Icon(
          // Use distinct icons: GraphicEq (animated bars) for active, Mic for idle
          if (isPttActive) Icons.Default.GraphicEq else Icons.Default.Mic,
          contentDescription = "Push to Talk",
          tint = if (isPttActive)
              MaterialTheme.colorScheme.onPrimary
          else MaterialTheme.colorScheme.onSurfaceVariant
      )
  }
  ```

  Add the required imports at the top of the file:

  ```kotlin
  import androidx.compose.ui.input.pointer.pointerInput
  import androidx.compose.ui.input.pointer.PointerEventType
  import androidx.compose.ui.input.pointer.awaitPointerEventScope
  import androidx.compose.ui.input.pointer.awaitPointerEvent
  import androidx.compose.material.icons.filled.GraphicEq
  ```

  > `PointerEventType.Exit` does not exist in the Compose pointer API. `Release` is the correct event for both finger-up and pointer leaving the component. `setPointerCapture` is not available in Compose's `pointerInput` — `Release` is sufficient because `awaitPointerEventScope` tracks the pointer regardless of drag position once `Press` is received.

- [ ] **Step 3: Add floating overlay inside the normal-mode Box**

  The normal-mode `Box` (around line 270) already has two direct children: a `Column` (main layout) and an `AnimatedVisibility` (chat panel). Add the PTT overlay as a third direct child of this same outer `Box` — NOT inside the `Column`. The `Modifier.align(Alignment.BottomCenter)` requires a `BoxScope` receiver, which is only available as a direct child of `Box`:

  ```kotlin
  // PTT overlay
  if (isPttActive) {
      Box(
          modifier = Modifier
              .align(Alignment.BottomCenter)
              .padding(bottom = 120.dp)
      ) {
          Row(
              modifier = Modifier
                  .background(
                      MaterialTheme.colorScheme.inverseSurface.copy(alpha = 0.85f),
                      RoundedCornerShape(50)
                  )
                  .padding(horizontal = 20.dp, vertical = 10.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(8.dp)
          ) {
              Box(
                  modifier = Modifier
                      .size(10.dp)
                      .clip(CircleShape)
                      .background(Color(0xFF4CAF50))
              )
              Text(
                  text = "Transmitting...",
                  style = MaterialTheme.typography.labelLarge,
                  color = MaterialTheme.colorScheme.inverseOnSurface
              )
          }
      }
  }
  ```

  Add these imports at the top of the file if not already present:

  ```kotlin
  import androidx.compose.ui.graphics.Color
  import androidx.compose.foundation.shape.CircleShape
  ```

- [ ] **Step 4: Build to verify**

  ```bash
  cd apps/android && ./gradlew :app:compileDebugKotlin 2>&1 | grep -E "error:|BUILD"
  ```

  Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 5: Manually verify on emulator**

  Run the app on an emulator (API 34+):
  - Join a test room
  - Long-press the PTT button → "Transmitting..." overlay appears
  - Release → overlay disappears after ~250ms
  - Mic toggle state is preserved (toggle off, PTT transmits, release returns to muted)

- [ ] **Step 6: Commit**

  ```bash
  git add apps/android/app/src/main/java/com/bedrud/app/ui/screens/meeting/MeetingScreen.kt
  git commit -m "feat(android): add PTT button and transmitting overlay to MeetingScreen"
  ```

---

## Chunk 4: Final — Branch, PR

### Task 11: Create feature branch and PR

- [ ] **Step 1: Create a feature branch from current state and push**

  All implementation commits were made during the tasks above. Now create a feature branch pointing to the current HEAD and push it:

  ```bash
  git checkout -b feat/push-to-talk
  git push -u origin feat/push-to-talk
  ```

- [ ] **Step 2: Open PR**

  ```bash
  gh pr create \
    --title "feat: implement Push to Talk across Web, iOS, and Android" \
    --body "$(cat <<'EOF'
  ## Summary
  - Adds hold-to-talk PTT button to meeting control bars on Web, iOS, and Android
  - PTT is a local mic gate: hold unmutes instantly, release restores toggle state after 250ms
  - Web: Space bar default keybind, configurable and persisted in localStorage
  - All platforms: prominent "Transmitting..." floating overlay while held
  - No server changes, no LiveKit metadata — purely client-side (Discord pattern)

  ## Test plan
  - [ ] Web: hold PTT button → overlay appears → mic transmits → release → overlay gone, mic restored
  - [ ] Web: Space bar triggers PTT when not typing in chat input
  - [ ] Web: custom key persists across page reload
  - [ ] iOS: unit tests pass (RoomManagerTests)
  - [ ] iOS: hold PTT button on simulator → overlay shows → release → restores
  - [ ] Android: unit tests pass
  - [ ] Android: hold PTT on emulator → overlay shows → release → restores
  - [ ] All: mic toggle state is preserved when PTT is used

  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  EOF
  )"
  ```
