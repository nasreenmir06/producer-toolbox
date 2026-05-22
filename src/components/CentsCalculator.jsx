import { useState, useRef } from 'react';
import { Button, Text, Group, NumberInput, Select, Stack } from '@mantine/core';
import { Mic, Square } from 'lucide-react';

export default function CentsCalculator() {
    const [cents, setCents] = useState(null);
    const [startingNote, setStartingNote] = useState(null);
    const [startingOctave, setStartingOctave] = useState(null);
    const [targetNote, setTargetNote] = useState(null);
    const [targetOctave, setTargetOctave] = useState(null);
    const [startingHz, setStartingHz] = useState(null);
    const [targetHz, setTargetHz] = useState(null);

    const noteMap = {
        'C': 0,
        'C#': 1,
        'D': 2,
        'D#': 3,
        'E': 4,
        'F': 5,
        'F#': 6,
        'G': 7, 
        'G#': 8,
        'A': 9,
        'A#': 10,
        'B': 11
    }

    const hzCalculator = () => {
        const centCalc = Math.round(1200 * (Math.log2(targetHz / startingHz)) * 100) / 100;
        if (centCalc > 0) {
            setCents(`+${centCalc}`);
        }
        else {
            setCents(centCalc);
        }
    }

    const noteCalculator = () => {
        if (startingNote && targetNote && startingOctave !== null && targetOctave !== null) {
            const semitones = (12 * targetOctave + noteMap[targetNote]) - (12 * startingOctave + noteMap[startingNote]);
            const centsBetweenNotes = semitones*100;
            if (centsBetweenNotes > 0) {
                setCents(`+${centsBetweenNotes}`);
            }
            else {
                setCents(centsBetweenNotes);
            }
        }
        else if (startingNote && targetNote) {
            const semitoneDistanceUp = ((noteMap[targetNote] - noteMap[startingNote] + 12) % 12)*100;
            const semitoneDistanceDown = 100*(12 - semitoneDistanceUp/100);
            setCents(`+${semitoneDistanceUp}, -${semitoneDistanceDown}`);
        }
    
    }

    return (
    <div style={{ padding: '10px' }}>
      {/* calculate cents between 2 notes */}
      <Stack mb="md"> 
        <Text>Pick a note!</Text>
        <Text>Starting Note</Text>
        <Select
            label="Choose a note"
            placeholder="Pick a note"
            value={startingNote}
            onChange={setStartingNote}
            data={[
                { value: 'C', label: 'C' },
                { value: 'C#', label: 'C♯/D♭' },
                { value: 'D', label: 'D' },
                { value: 'D#', label: 'D♯/E♭' },
                { value: 'E', label: 'E' },
                { value: 'F', label: 'F' },
                { value: 'F#', label: 'F♯/G♭' },
                { value: 'G', label: 'G' },
                { value: 'G#', label: 'G♯/A♭' },
                { value: 'A', label: 'A' },
                { value: 'A#', label: 'A♯/B♭' },
                { value: 'B', label: 'B' },
            ]}
        />
        <NumberInput
            label="Input (0-8) (optional)"
            value={startingOctave}
            onChange={setStartingOctave}
            placeholder="Enter a number"
            min={0}
            max={8}
            step={1}
            clampBehavior="strict"
        />
        <Text>Target Note</Text>
        <Select
            label="Choose a note"
            value={targetNote}
            onChange={setTargetNote}
            placeholder="Pick a note"
            data={[
                { value: 'C', label: 'C' },
                { value: 'C#', label: 'C♯/D♭' },
                { value: 'D', label: 'D' },
                { value: 'D#', label: 'D♯/E♭' },
                { value: 'E', label: 'E' },
                { value: 'F', label: 'F' },
                { value: 'F#', label: 'F♯/G♭' },
                { value: 'G', label: 'G' },
                { value: 'G#', label: 'G♯/A♭' },
                { value: 'A', label: 'A' },
                { value: 'A#', label: 'A♯/B♭' },
                { value: 'B', label: 'B' },
            ]}
        />
        <NumberInput
            label="Input (0-8) (optional)"
            value={targetOctave}
            onChange={setTargetOctave}
            placeholder="Enter a number"
            min={0}
            max={8}
            step={1}
            clampBehavior="strict"
        />
        <Button color="blue" onClick={noteCalculator}>
            Calculate
        </Button>
      </Stack>

      {/* calculate cents between 2 hZ */}
      <Stack mb="md"> 
        <Text>Enter a frequency</Text>
        <Text>Starting Hz</Text>
        <NumberInput
            label="Type a frequency (hZ)"
            value={startingHz}
            onChange={setStartingHz}
            placeholder="0.0"
            decimalScale={2} 
            allowDecimal={true}
            allowNegative={false}
        />
        <Text>Target Hz</Text>
        <NumberInput
            label="Type a frequency (hz)"
            value={targetHz}
            onChange={setTargetHz}
            placeholder="0.0"
            decimalScale={2}
            allowDecimal={true}
            allowNegative={false}
        />
        <Button color="blue" onClick={hzCalculator}>
            Calculate
        </Button>
      </Stack>
      <Stack mb="md"> 
        <Text>{cents} cents</Text>
      </Stack>
    </div>
    );
}