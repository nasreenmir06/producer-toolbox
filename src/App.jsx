import { useState, useEffect } from 'react'
import { Tabs, Checkbox, Title, Text, Button } from '@mantine/core'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import AudioRecorder from './components/AudioRecorder';
import PitchDetectorComponent from './components/PitchDetector';
import TempoTapper from './components/TempoTapper';
import CentsCalculator from './components/CentsCalculator';
import BPMDetector from './components/BPMDetector';
import StripSilence from './components/StripSilence';
import './App.css'

// COMPONENT DEFINITOINS
function ToolPanel({ value, title, children }) {
  return (
    <Tabs.Panel value={value} pt="xs">
      <Title order={4} mb="sm" c="dimmed">{title}</Title>
      {children}
    </Tabs.Panel>
  );
}

function TabCheckbox({ label, value, tabsVisible, setTabsVisible}) {
  return (
    <Checkbox
      label={label}
      checked={tabsVisible[value]}
      onChange={(e) => setTabsVisible({ ...tabsVisible, [value]: e.currentTarget.checked })}
      mb="xs"
    />
  );
}

// END OF COMPONENT DEFS

function App() {
  const [count, setCount] = useState(0)
  const [tabsVisible, setTabsVisible] = useState({
    pitchDetector: true,
    browserAudioRecorder: true,
    tempoTapper: true,
    centsCalculator: true,
    BPMDetector: true,
    stripSilence: true,
    settings: true
  })

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get('tabsVisible', (data) => {
        if (data.tabsVisible) {
          setTabsVisible(data.tabsVisible)
        }
      })
    }
  }, [])

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ tabsVisible })
    }
  }, [tabsVisible])

  return (
    <>
      <section id="center">
        <Title order={1}>Producer Toolbox</Title>
      </section>

      <section id="next-steps" style={{ marginTop: '20px' }}>
        <Tabs defaultValue="pitchDetector">
          {/* TAB SETUP */}
          <Tabs.List>
            {tabsVisible.pitchDetector && <Tabs.Tab value="pitchDetector">Pitch Detector</Tabs.Tab>}
            {tabsVisible.browserAudioRecorder && <Tabs.Tab value="browserAudioRecorder">Record Browser Audio</Tabs.Tab>}
            {tabsVisible.tempoTapper && <Tabs.Tab value="tempoTapper">Tempo Tapper</Tabs.Tab>}
            {tabsVisible.centsCalculator && <Tabs.Tab value="centsCalculator">Cents Calculator</Tabs.Tab>}
            {tabsVisible.BPMDetector && <Tabs.Tab value="BPMDetector">BPM Detector</Tabs.Tab>}
            {tabsVisible.stripSilence && <Tabs.Tab value="stripSilence">Strip Silence</Tabs.Tab>}
            {tabsVisible.settings && <Tabs.Tab value="settings">Settings</Tabs.Tab>}
          </Tabs.List>

          {/* TOOL PANEL SETUP */}
          <ToolPanel value="pitchDetector" title="Pitch Detector">
            <Text size="sm">Hum a note, or play something in your DAW... let's see what it's pitch is!</Text>
            <PitchDetectorComponent/>
          </ToolPanel>

          <ToolPanel value="browserAudioRecorder" title="Record Browser Audio">
            <Text size="sm">Easily capture and save browser audio, for easy sampling</Text>
            <AudioRecorder/>
          </ToolPanel>

          <ToolPanel value="tempoTapper" title="Tempo Tapper">
            <Text size="sm">Tap along to a beat and we'll give you the BPM</Text>
            <TempoTapper/>
          </ToolPanel>

          <ToolPanel value="centsCalculator" title="Cents Calculator">
            <Text size="sm">Calculate the cents between two notes/frequencies</Text>
            <CentsCalculator/>
          </ToolPanel>

          <ToolPanel value="BPMDetector" title="BPM Detector">
            <BPMDetector/>
            <Text size="sm">Find the BPM of an uploaded file</Text>
          </ToolPanel>

          <ToolPanel value="stripSilence" title="Strip Silence">
            <Text size="sm" mb="sm">Remove silence from an audio file</Text>
            <StripSilence/>
          </ToolPanel>

          {/* SETTINGS CHECKBOX SETUP */}
          <ToolPanel value="settings" title="Toolbox Settings">
            <TabCheckbox label="Show Pitch Detector" value="pitchDetector" tabsVisible={tabsVisible} setTabsVisible={setTabsVisible}></TabCheckbox>
            <TabCheckbox label="Show Browser Audio Recorder" value="browserAudioRecorder" tabsVisible={tabsVisible} setTabsVisible={setTabsVisible}></TabCheckbox>
            <TabCheckbox label="Show Tempo Tapper" value="tempoTapper" tabsVisible={tabsVisible} setTabsVisible={setTabsVisible}></TabCheckbox>
            <TabCheckbox label="Show Cents Calculator" value="centsCalculator" tabsVisible={tabsVisible} setTabsVisible={setTabsVisible}></TabCheckbox>
            <TabCheckbox label="Show BPM Detector" value="BPMDetector" tabsVisible={tabsVisible} setTabsVisible={setTabsVisible}></TabCheckbox>
            <TabCheckbox label="Show Strip Silence" value="stripSilence" tabsVisible={tabsVisible} setTabsVisible={setTabsVisible}></TabCheckbox>
          </ToolPanel>
        </Tabs>
      </section>
    </>
  )
}

export default App