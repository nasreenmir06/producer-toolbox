import { useState, useEffect } from 'react'
import { Checkbox, Title, Text, ActionIcon, Modal, SimpleGrid, Card, Stack, Switch, Group, useMantineColorScheme } from '@mantine/core'
import AudioRecorder from './components/AudioRecorder';
import PitchDetectorComponent from './components/PitchDetector';
import TempoTapper from './components/TempoTapper';
import CentsCalculator from './components/CentsCalculator';
import BPMDetector from './components/BPMDetector';
import StripSilence from './components/StripSilence';
import { IconSettings, IconWaveSine, IconSparkles, IconMicrophone, IconMusic, IconCalculator, IconActivityHeartbeat, IconVolume3, IconCut, IconSun, IconMoon } from '@tabler/icons-react'
import './App.css'

// COMPONENT DEFINITIONS
function TabCheckbox({ label, value, tabsVisible, setTabsVisible }) {
  return (
    <Checkbox
      label={label}
      checked={tabsVisible[value]}
      onChange={(e) => setTabsVisible({ ...tabsVisible, [value]: e.currentTarget.checked })}
      mb="xs"
    />
  );
}

function ToolCard({ icon, label, onClick, visible }) {
  if (!visible) return null;
  return (
    <Card
      shadow="sm"
      padding="md"
      radius="md"
      withBorder
      onClick={onClick}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      <Stack align="center" gap="xs">
        {icon}
        <Text size="sm" fw={500} ta="center">{label}</Text>
      </Stack>
    </Card>
  );
}
// END OF COMPONENT DEFS

const TOOLS = [
  { key: 'pitchDetector',        label: 'Pitch Detector',       icon: <IconWaveSine size={28} />,         component: <PitchDetectorComponent /> },
  { key: 'browserAudioRecorder', label: 'Record Browser Audio', icon: <IconMicrophone size={28} />,       component: <AudioRecorder /> },
  { key: 'tempoTapper',          label: 'Tempo Tapper',         icon: <IconMusic size={28} />,            component: <TempoTapper /> },
  { key: 'centsCalculator',      label: 'Cents Calculator',     icon: <IconCalculator size={28} />,       component: <CentsCalculator /> },
  { key: 'BPMDetector',          label: 'BPM Detector',         icon: <IconActivityHeartbeat size={28} />,component: <BPMDetector /> },
  { key: 'stripSilence', label: 'Strip Silence', icon: <IconCut size={28} />, component: <StripSilence /> },
];

function App() {
  const [activeTool, setActiveTool] = useState(null);
  const {colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tabsVisible, setTabsVisible] = useState({
    pitchDetector: true,
    browserAudioRecorder: true,
    tempoTapper: true,
    centsCalculator: true,
    BPMDetector: true,
    stripSilence: true,
  });

  // load saved visibility from chrome storage
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get('tabsVisible', (data) => {
        if (data.tabsVisible) {
          setTabsVisible(data.tabsVisible)
        }
      })
    }
  }, [])

  // save visibility to chrome storage on change
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ tabsVisible })
    }
  }, [tabsVisible])

  const activeTool_data = TOOLS.find(t => t.key === activeTool);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 0' }}>
        <Title order={2}>
          {activeTool_data ? (
            <span
              onClick={() => setActiveTool(null)}
              style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 400, opacity: 0.6 }}
            >
              ← Back
            </span>
          ) : 'Producer Toolbox'}
        </Title>
        <ActionIcon variant="subtle" size="lg" onClick={() => setSettingsOpen(true)} aria-label="Settings">
          <IconSettings size={22} />
        </ActionIcon>
      </div>

      {/* TOOL VIEW */}
      {activeTool_data ? (
        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Title order={4} mb="sm" c="dimmed">{activeTool_data.label}</Title>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {activeTool_data.component}
          </div>
        </div>
      ) : (
        /* HOME GRID */
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <SimpleGrid cols={2} spacing="sm">
            {TOOLS.map(tool => (
              <ToolCard
                key={tool.key}
                icon={tool.icon}
                label={tool.label}
                visible={tabsVisible[tool.key]}
                onClick={() => setActiveTool(tool.key)}
              />
            ))}
          </SimpleGrid>
          <Card
            shadow="sm"
            padding="md"
            radius="md"
            withBorder
            style={{ opacity: 0.4, cursor: 'default', marginTop: '8px', flex: 1 }}
          >
            <Stack align="center" justify="center" gap="xs" style={{ height: '100%' }}>
              <IconSparkles size={28} />
              <Text size="sm" fw={500} ta="center">More to come!</Text>
            </Stack>
          </Card>
          <Text size="xs" c="dimmed" ta="center" mt="xs"> 
            Please email nasreenmir06@gmail.com for any bug reports, feedback, or suggestions!
          </Text>
        </div>
      )}

      {/* SETTINGS MODAL */}
      <Modal
        opened={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Toolbox Settings"
        size="sm"
      >
        {TOOLS.map(tool => (
          <TabCheckbox
            key={tool.key}
            label={`Show ${tool.label}`}
            value={tool.key}
            tabsVisible={tabsVisible}
            setTabsVisible={setTabsVisible}
          />
        ))}
        <Group justify="space-between" mb="md">
        <Group gap="xs">
          {colorScheme === 'dark' ? <IconMoon size={16} /> : <IconSun size={16} />}
          <Text size="sm">{colorScheme === 'dark' ? 'Dark mode' : 'Light mode'}</Text>
        </Group>
        <Switch
          checked={colorScheme === 'dark'}
          onChange={toggleColorScheme}
        />
      </Group>
      </Modal>
    </div>
  )
}

export default App