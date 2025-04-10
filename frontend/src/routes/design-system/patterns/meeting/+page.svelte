<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Tabs from '$lib/components/ui/tabs';
  import { Separator } from '$lib/components/ui/separator';
  import { Mic, MicOff, Video, VideoOff, MessageCircle, Users, LogOut, LayoutGrid, MonitorSmartphone, Copy, Check } from 'lucide-svelte';
  
  // Sample participant data
  const participants = [
    { id: 1, name: 'You', isMuted: false, isVideoOff: false },
    { id: 2, name: 'John Apple', isMuted: true, isVideoOff: false },
    { id: 3, name: 'Sarah Johnson', isMuted: false, isVideoOff: true },
    { id: 4, name: 'Miguel Santos', isMuted: true, isVideoOff: false }
  ];
  
  // State for interactive demo
  let muted = $state(false);
  let videoOff = $state(false);
  let spotlightId = $state(null);
  let direction = $state('ltr');
  let copySuccess = $state(false);
  
  function toggleMute() {
    muted = !muted;
  }
  
  function toggleVideo() {
    videoOff = !videoOff;
  }
  
  function toggleDirection() {
    direction = direction === 'ltr' ? 'rtl' : 'ltr';
  }
  
  function setSpotlight(id) {
    spotlightId = spotlightId === id ? null : id;
  }
  
  function copyCode(code) {
    navigator.clipboard.writeText(code);
    copySuccess = true;
    setTimeout(() => copySuccess = false, 2000);
  }
</script>

<svelte:head>
  <title>Meeting UI Pattern - Bedrud Design System</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Meeting UI Pattern</h1>
    <p class="text-muted-foreground mt-2">
      A comprehensive video conferencing interface with participant grid, controls, and layout options.
    </p>
  </div>
  
  <Separator />
  
  <!-- Meeting UI Overview -->
  <section class="space-y-6">
    <h2 class="text-2xl font-semibold">Overview</h2>
    <p class="text-muted-foreground mb-4">
      The meeting UI consists of three main sections: header with meeting info, video grid, and control bar.
      This pattern handles both RTL and LTR layouts, spotlight mode, and different participant states.
    </p>
    
    <Card.Root>
      <Card.Header>
        <Card.Title>Meeting Interface Example</Card.Title>
        <Card.Description>
          Interactive example of the meeting interface
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div class={`border rounded-lg overflow-hidden ${direction === 'rtl' ? 'rtl' : ''}`}>
          <!-- Header Mock -->
          <div class="bg-background border-b p-3 flex justify-between items-center">
            <div class={`flex items-center ${direction === 'rtl' ? 'space-x-reverse' : ''} space-x-4`}>
              <h3 class="font-medium">Meeting Title</h3>
              <div class="h-4 w-px bg-muted-foreground/30"></div>
              <div class={`flex items-center ${direction === 'rtl' ? 'space-x-reverse' : ''} space-x-1 text-muted-foreground text-xs`}>
                <Users class="h-3.5 w-3.5" />
                <span>4</span>
              </div>
            </div>
            <div class={`flex items-center ${direction === 'rtl' ? 'space-x-reverse' : ''} space-x-2`}>
              <Button variant="ghost" size="sm" onclick={toggleDirection} class="h-8">
                {direction === 'rtl' ? 'LTR' : 'RTL'}
              </Button>
              <Button variant="ghost" size="sm" class="h-8">
                <LogOut class={`h-3.5 w-3.5 ${direction === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                Leave
              </Button>
            </div>
          </div>
          
          {#if spotlightId !== null}
            <!-- Spotlight Mode -->
            <div class="bg-muted/20 p-3 h-[240px]">
              <div class="h-full rounded overflow-hidden bg-muted relative flex items-center justify-center">
                {#if participants.find(p => p.id === spotlightId).isVideoOff}
                  <div class="flex flex-col items-center">
                    <div class="w-16 h-16 rounded-full bg-muted-foreground/20 flex items-center justify-center mb-2">
                      <span class="text-lg">{participants.find(p => p.id === spotlightId).name.charAt(0)}</span>
                    </div>
                    <span>{participants.find(p => p.id === spotlightId).name}</span>
                  </div>
                {:else}
                  <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
                {/if}
                
                <div class={`absolute bottom-2 ${direction === 'rtl' ? 'right-2' : 'left-2'} bg-black/60 px-2 py-1 rounded text-white text-xs flex items-center`}>
                  <span>{participants.find(p => p.id === spotlightId).name}</span>
                  {#if participants.find(p => p.id === spotlightId).isMuted}
                    <MicOff class={`${direction === 'rtl' ? 'mr-1.5' : 'ml-1.5'} h-3 w-3`} />
                  {/if}
                </div>
                
                <button 
                  class={`absolute top-2 ${direction === 'rtl' ? 'left-2' : 'right-2'} bg-black/60 p-1.5 rounded-full text-white hover:bg-black/80`}
                  onclick={() => setSpotlight(null)}
                >
                  <i data-lucide="minimize-2" class="h-4 w-4"></i>
                </button>
              </div>
            </div>
          {:else}
            <!-- Video Grid Mock -->
            <div class="bg-muted/20 p-3 grid grid-cols-2 gap-2 h-[240px]">
              {#each participants as participant}
                <div class="relative rounded overflow-hidden bg-muted flex items-center justify-center">
                  {#if participant.isVideoOff || participant.id === 1 && videoOff}
                    <div class="flex flex-col items-center">
                      <div class="w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                        <span class="text-sm">{participant.name.charAt(0)}</span>
                      </div>
                    </div>
                  {:else}
                    <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
                  {/if}
                  
                  <div class={`absolute bottom-1 ${direction === 'rtl' ? 'right-1' : 'left-1'} bg-black/50 px-1.5 py-0.5 rounded text-white text-xs flex items-center`}>
                    <span>{participant.id === 1 ? 'You' : participant.name}</span>
                    {#if participant.isMuted || (participant.id === 1 && muted)}
                      <MicOff class={`${direction === 'rtl' ? 'mr-1' : 'ml-1'} h-3 w-3`} />
                    {/if}
                  </div>
                  
                  <button 
                    class={`absolute top-1 ${direction === 'rtl' ? 'left-1' : 'right-1'} bg-black/50 p-1 rounded-full text-white hover:bg-black/70 opacity-0 hover:opacity-100 transition-opacity`}
                    onclick={() => setSpotlight(participant.id)}
                  >
                    <i data-lucide="maximize-2" class="h-3 w-3"></i>
                  </button>
                </div>
              {/each}
            </div>
          {/if}
          
          <!-- Controls Mock -->
          <div class="bg-background border-t p-3 flex justify-between items-center">
            <div class="flex-1 flex justify-start">
              <div class="text-xs text-muted-foreground">
                12:45 • Meeting ID: 123-456-789
              </div>
            </div>
            
            <div class={`flex-1 flex justify-center ${direction === 'rtl' ? 'space-x-reverse' : ''} space-x-2`}>
              <Button variant={muted ? "destructive" : "outline"} size="icon" onclick={toggleMute} class="h-9 w-9">
                {#if muted}
                  <MicOff class="h-4 w-4" />
                {:else}
                  <Mic class="h-4 w-4" />
                {/if}
              </Button>
              <Button variant={videoOff ? "destructive" : "outline"} size="icon" onclick={toggleVideo} class="h-9 w-9">
                {#if videoOff}
                  <VideoOff class="h-4 w-4" />
                {:else}
                  <Video class="h-4 w-4" />
                {/if}
              </Button>
              <Button variant="destructive" class="h-9 px-3">
                <LogOut class={`h-4 w-4 ${direction === 'rtl' ? 'ml-1.5' : 'mr-1.5'}`} />
                End
              </Button>
            </div>
            
            <div class={`flex-1 flex justify-end ${direction === 'rtl' ? 'space-x-reverse' : ''} space-x-2`}>
              <Button variant="outline" size="icon" class="h-8 w-8">
                <MessageCircle class="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" class="h-8 w-8">
                <Users class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card.Content>
      <Card.Footer class="flex justify-between items-center border-t p-4">
        <div class="text-sm text-muted-foreground">
          Try toggling controls and spotlight mode.
        </div>
      </Card.Footer>
    </Card.Root>
  </section>
  
  <Separator />
  
  <!-- Component Breakdown -->
  <section class="space-y-6">
    <h2 class="text-2xl font-semibold">Component Breakdown</h2>
    
    <Tabs.Root value="header">
      <Tabs.List>
        <Tabs.Trigger value="header">Header</Tabs.Trigger>
        <Tabs.Trigger value="grid">Video Grid</Tabs.Trigger>
        <Tabs.Trigger value="controls">Control Bar</Tabs.Trigger>
      </Tabs.List>
      
      <Tabs.Content value="header" class="pt-4">
        <Card.Root>
          <Card.Header>
            <Card.Title>Header Component</Card.Title>
            <Card.Description>
              Contains meeting title, participant count, and general meeting controls
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            <div class="bg-background border rounded-lg p-3 flex justify-between items-center">
              <div class="flex items-center space-x-4">
                <h3 class="font-medium">Meeting Title</h3>
                <div class="h-4 w-px bg-muted-foreground/30"></div>
                <div class="flex items-center space-x-1 text-muted-foreground text-xs">
                  <Users class="h-3.5 w-3.5" />
                  <span>4</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" class="h-8">
                <LogOut class="h-3.5 w-3.5 mr-1" />
                Leave
              </Button>
            </div>
            
            <div class="text-sm text-muted-foreground space-y-2">
              <p>The header should:</p>
              <ul class="list-disc pl-5 space-y-1">
                <li>Display the meeting name prominently</li>
                <li>Show participant count for awareness</li>
                <li>Provide quick access to leave the meeting</li>
                <li>Be compact to maximize screen space for video</li>
                <li>Use translucent background for context awareness</li>
              </ul>
            </div>
          </Card.Content>
          <Card.Footer class="flex justify-end border-t p-4">
            <Button 
              variant="ghost" 
              size="sm"
              class="flex items-center gap-1"
              onclick={() => copyCode(`<header class="bg-background/95 backdrop-blur border-b">
  <div class="flex h-14 items-center px-4 justify-between">
    <div class="flex items-center gap-4">
      <h1 class="font-semibold">Meeting Title</h1>
      <Separator orientation="vertical" class="h-4" />
      <div class="flex items-center gap-1 text-muted-foreground text-sm">
        <Users class="h-4 w-4" />
        <span>{participantCount}</span>
      </div>
    </div>
    <Button variant="ghost" size="sm" onclick={leaveMeeting}>
      <LogOut class="h-4 w-4 mr-2" />
      Leave
    </Button>
  </div>
</header>`)}
            >
              {#if copySuccess}
                <Check class="h-3.5 w-3.5 mr-1" />
                Copied
              {:else}
                <Copy class="h-3.5 w-3.5 mr-1" />
                Copy code
              {/if}
            </Button>
          </Card.Footer>
        </Card.Root>
      </Tabs.Content>
      
      <Tabs.Content value="grid" class="pt-4">
        <Card.Root>
          <Card.Header>
            <Card.Title>Video Grid Component</Card.Title>
            <Card.Description>
              Displays all participants with their video or avatars
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            <div class="bg-muted/20 p-3 grid grid-cols-2 gap-2 border rounded-lg h-[200px]">
              {#each participants.slice(0, 2) as participant}
                <div class="relative rounded overflow-hidden bg-muted flex items-center justify-center">
                  <div class="flex flex-col items-center">
                    <div class="w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                      <span class="text-sm">{participant.name.charAt(0)}</span>
                    </div>
                  </div>
                  <div class="absolute bottom-1 left-1 bg-black/50 px-1.5 py-0.5 rounded text-white text-xs flex items-center">
                    <span>{participant.name}</span>
                    {#if participant.isMuted}
                      <MicOff class="ml-1 h-3 w-3" />
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
            
            <div class="text-sm text-muted-foreground space-y-2">
              <p>The video grid should:</p>
              <ul class="list-disc pl-5 space-y-1">
                <li>Adjust layout based on number of participants</li>
                <li>Display name labels for each participant</li>
                <li>Show mute status and video status</li>
                <li>Allow spotlight mode for focusing on one participant</li>
                <li>Handle both video streams and avatar fallbacks</li>
                <li>Highlight the active speaker with a subtle border</li>
              </ul>
            </div>
          </Card.Content>
          <Card.Footer class="flex justify-end border-t p-4">
            <Button 
              variant="ghost" 
              size="sm"
              class="flex items-center gap-1"
              onclick={() => copyCode(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full auto-rows-fr">
  {#each participants as participant (participant.identity)}
    <div class="relative w-full h-full">
      <Card.Root class="absolute inset-0 overflow-hidden">
        <div class="absolute inset-0 bg-muted flex items-center justify-center">
          {#if !participant.isVideoOn}
            <div class="flex flex-col items-center">
              <div class="w-16 h-16 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                <span class="text-xl">{participant.name[0]}</span>
              </div>
            </div>
          {:else}
            <video class="w-full h-full object-cover"></video>
          {/if}
          
          <div class="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-white text-xs flex items-center">
            <span>{participant.name}</span>
            {#if participant.isMuted}
              <MicOff class="ml-1.5 h-3 w-3" />
            {/if}
          </div>
        </div>
      </Card.Root>
    </div>
  {/each}
</div>`)}
            >
              {#if copySuccess}
                <Check class="h-3.5 w-3.5 mr-1" />
                Copied
              {:else}
                <Copy class="h-3.5 w-3.5 mr-1" />
                Copy code
              {/if}
            </Button>
          </Card.Footer>
        </Card.Root>
      </Tabs.Content>
      
      <Tabs.Content value="controls" class="pt-4">
        <Card.Root>
          <Card.Header>
            <Card.Title>Control Bar Component</Card.Title>
            <Card.Description>
              Provides user controls for audio, video, and meeting interaction
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            <div class="bg-background border rounded-lg p-3 flex justify-between items-center">
              <div class="flex-1 flex justify-start">
                <div class="text-xs text-muted-foreground">
                  12:45 • Meeting ID: 123-456-789
                </div>
              </div>
              
              <div class="flex-1 flex justify-center space-x-2">
                <Button variant="outline" size="icon" class="h-9 w-9">
                  <Mic class="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" class="h-9 w-9">
                  <Video class="h-4 w-4" />
                </Button>
                <Button variant="destructive" class="h-9 px-3">
                  <LogOut class="h-4 w-4 mr-1.5" />
                  End
                </Button>
              </div>
              
              <div class="flex-1 flex justify-end space-x-2">
                <Button variant="outline" size="icon" class="h-8 w-8">
                  <MessageCircle class="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" class="h-8 w-8">
                  <Users class="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div class="text-sm text-muted-foreground space-y-2">
              <p>The control bar should:</p>
              <ul class="list-disc pl-5 space-y-1">
                <li>Group controls by function (media, meeting, sidebar)</li>
                <li>Show the most important controls prominently in the center</li>
                <li>Use destructive styling for ending calls</li>
                <li>Show toggle state for mute/video buttons</li>
                <li>Be accessible with proper keyboard navigation</li>
                <li>Adapt layout for mobile devices</li>
              </ul>
            </div>
          </Card.Content>
          <Card.Footer class="flex justify-end border-t p-4">
            <Button 
              variant="ghost" 
              size="sm"
              class="flex items-center gap-1"
              onclick={() => copyCode(`<div class="border-t bg-background/95 backdrop-blur">
  <div class="flex h-16 items-center justify-between px-4">
    <div class="text-sm text-muted-foreground">
      {meetingTime} • Meeting ID: {meetingId}
    </div>
    
    <div class="flex items-center gap-2">
      <Button 
        variant={audioEnabled ? "outline" : "destructive"} 
        size="icon" 
        onclick={toggleAudio}
      >
        {#if audioEnabled}
          <Mic class="h-4 w-4" />
        {:else}
          <MicOff class="h-4 w-4" />
        {/if}
      </Button>
      
      <Button 
        variant={videoEnabled ? "outline" : "destructive"} 
        size="icon" 
        onclick={toggleVideo}
      >
        {#if videoEnabled}
          <Video class="h-4 w-4" />
        {:else}
          <VideoOff class="h-4 w-4" />
        {/if}
      </Button>
      
      <Button variant="destructive" onclick={leaveMeeting}>
        <LogOut class="h-4 w-4 mr-2" />
        End Call
      </Button>
    </div>
    
    <div class="flex items-center gap-2">
      <Button variant="outline" size="icon">
        <MessageCircle class="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon">
        <Users class="h-4 w-4" />
      </Button>
    </div>
  </div>
</div>`)}
            >
              {#if copySuccess}
                <Check class="h-3.5 w-3.5 mr-1" />
                Copied
              {:else}
                <Copy class="h-3.5 w-3.5 mr-1" />
                Copy code
              {/if}
            </Button>
          </Card.Footer>
        </Card.Root>
      </Tabs.Content>
    </Tabs.Root>
  </section>
  
  <Separator />
  
  <!-- Usage Guidelines -->
  <section class="space-y-6">
    <h2 class="text-2xl font-semibold">Usage Guidelines</h2>
    
    <div class="grid md:grid-cols-2 gap-6">
      <Card.Root>
        <Card.Header>
          <Card.Title>Layout Considerations</Card.Title>
        </Card.Header>
        <Card.Content>
          <ul class="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Use adaptive grid layouts based on participant count</li>
            <li>For 1-2 participants, use larger video containers</li>
            <li>For 3+ participants, use grid layouts with equal sizing</li>
            <li>For 7+ participants, consider pagination or scrolling</li>
            <li>Maintain 16:9 aspect ratio for video containers when possible</li>
            <li>Always highlight the local user with a subtle indicator</li>
          </ul>
        </Card.Content>
      </Card.Root>
      
      <Card.Root>
        <Card.Header>
          <Card.Title>Internationalization</Card.Title>
        </Card.Header>
        <Card.Content>
          <ul class="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Support both LTR and RTL layouts</li>
            <li>Use locale-appropriate time formats</li>
            <li>Ensure name labels support non-Latin characters</li>
            <li>Use icons consistently regardless of text direction</li>
            <li>Test layouts with longer text strings from translations</li>
            <li>Ensure controls maintain the same functionality in RTL mode</li>
          </ul>
        </Card.Content>
      </Card.Root>
      
      <Card.Root class="md:col-span-2">
        <Card.Header>
          <Card.Title>Accessibility</Card.Title>
        </Card.Header>
        <Card.Content>
          <ul class="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Ensure all controls have proper focus indicators</li>
            <li>Provide keyboard shortcuts for common actions (mute, video toggle)</li>
            <li>Use proper ARIA labels for icon-only buttons</li>
            <li>Indicate participant status both visually and with text</li>
            <li>Ensure sufficient contrast for text overlays on video</li>
            <li>Provide clear visual feedback for toggle states</li>
            <li>Support screen readers with appropriate notifications for meeting events</li>
          </ul>
        </Card.Content>
      </Card.Root>
    </div>
  </section>
  
  <Separator />
  
  <!-- Implementation Example -->
  <section class="space-y-6">
    <h2 class="text-2xl font-semibold">Implementation</h2>
    <p class="text-muted-foreground">
      For a complete implementation, refer to the meeting page component available at <code>src/routes/m/[meetId]/+page.svelte</code>.
      This component demonstrates handling video streams, participant management, and meeting controls.
    </p>
    
    <Card.Root>
      <Card.Header>
        <Card.Title>Key Components Used</Card.Title>
      </Card.Header>
      <Card.Content>
        <ul class="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          <li class="p-2 border rounded-md">
            <div class="font-medium">Button</div>
            <div class="text-sm text-muted-foreground">For all interactive controls</div>
          </li>
          <li class="p-2 border rounded-md">
            <div class="font-medium">Card</div>
            <div class="text-sm text-muted-foreground">Container for participant videos</div>
          </li>
          <li class="p-2 border rounded-md">
            <div class="font-medium">Separator</div>
            <div class="text-sm text-muted-foreground">Visual dividers in header</div>
          </li>
          <li class="p-2 border rounded-md">
            <div class="font-medium">Icons</div>
            <div class="text-sm text-muted-foreground">Visual indicators for actions</div>
          </li>
          <li class="p-2 border rounded-md">
            <div class="font-medium">Grid Layout</div>
            <div class="text-sm text-muted-foreground">For organizing participant tiles</div>
          </li>
          <li class="p-2 border rounded-md">
            <div class="font-medium">State Indicators</div>
            <div class="text-sm text-muted-foreground">For mute/video status</div>
          </li>
        </ul>
      </Card.Content>
    </Card.Root>
  </section>
</div>
