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
    const [activeCalculator, setActiveCalculator] = useState(null);
    const [startingOctaveError, setStartingOctaveError] = useState(null);
    const [targetOctaveError, setTargetOctaveError] = useState(null);

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
        setActiveCalculator('hz');
    }

    const noteCalculator = () => {
        // clear prev validation errors
        setStartingOctaveError(null);
        setTargetOctaveError(null);

        // identifu true inputs from nullstates 
        const hasStartOctave = startingOctave !== null && startingOctave !== undefined && startingOctave !== '';
        const hasTargetOctave = targetOctave !== null && targetOctave !== undefined && targetOctave !== '';

        // check if exactly one octave is entered
        if ((hasStartOctave && !hasTargetOctave) || (!hasStartOctave && hasTargetOctave)) {
            const errorMsg = "Must provide both octaves to use octave calculation";
            if (!hasStartOctave) setStartingOctaveError(errorMsg);
            if (!hasTargetOctave) setTargetOctaveError(errorMsg);
            return; 
        }

        // calculate cents based on input w and w/o octave info
        if (startingNote && targetNote && hasStartOctave && hasTargetOctave) {
            const semitones = (12 * targetOctave + noteMap[targetNote]) - (12 * startingOctave + noteMap[startingNote]);
            const centsBetweenNotes = semitones*100;
            if (centsBetweenNotes > 0) {
                setCents(`+${centsBetweenNotes}`);
            }
            else {
                setCents(centsBetweenNotes);
            }
            setActiveCalculator('note');
        }
        else if (startingNote && targetNote) {
            const semitoneDistanceUp = ((noteMap[targetNote] - noteMap[startingNote] + 12) % 12)*100;
            const semitoneDistanceDown = 100*(12 - semitoneDistanceUp/100);
            setCents(`+${semitoneDistanceUp}, -${semitoneDistanceDown}`);
            setActiveCalculator('note');
        }
    
    }

    // for displaying calculated result
    const ResultDisplay = () => {
        if (cents === null) return null;

        // build desc based on whihc calculator is used
        let calculationDetails = '';

        if (activeCalculator === 'note') {
            const startOctaveText = startingOctave !== null ? startingOctave : '';
            const targetOctaveText = targetOctave !== null ? targetOctave : '';
            
            calculationDetails = `${startingNote}${startOctaveText} to ${targetNote}${targetOctaveText}: `;
        } else if (activeCalculator === 'hz') {
            calculationDetails = `${startingHz}Hz to ${targetHz}Hz: `;
        }

        return (
            <Stack my="md" align="center"> 
                <Text size="lg" fw={600} color="green">
                    {calculationDetails}{cents} cents
                </Text>
            </Stack>
        );
    };

    return (
    <div style={{ padding: '10px' }}>
      {/* calculate cents between 2 notes */}
      <Stack mb="md"> 
        <Text size="xl" fw={700} ta="center">Note calculator</Text>
        <Select
            label="Choose a starting note"
            labelProps={{ mb: 'xs' }}
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
            label="Starting Octave (0-8) (optional)"
            labelProps={{ mb: 'xs' }}
            value={startingOctave}
            onChange={(val) => {
                setStartingOctave(val);
                // clear errors when typing
                setStartingOctaveError(null); 
            }}
            placeholder="Enter a number"
            min={0}
            max={8}
            step={1}
            clampBehavior="strict"
            error={startingOctaveError}
        />
        <Select
            label="Choose a target note"
            labelProps={{ mb: 'xs' }}
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
            label="Target Octave (0-8) (optional)"
            labelProps={{ mb: 'xs' }}
            value={targetOctave}
            onChange={(val) => {
                setTargetOctave(val);
                // clear errors when typing
                setTargetOctaveError(null); 
            }}
            placeholder="Enter a number"
            min={0}
            max={8}
            step={1}
            clampBehavior="strict"
            error={targetOctaveError}
        />
        <Button color="blue" onClick={noteCalculator}>
            Calculate
        </Button>
        {/* show here only if note calculator was clicked */}
        {activeCalculator === 'note' && <ResultDisplay />}
      </Stack>

      {/* calculate cents between 2 hZ */}
      <Stack mb="md"> 
        <Text size="xl" fw={700} ta="center">Frequency calculator</Text>
        <NumberInput
            label="Enter a starting frequency (Hz)"
            labelProps={{ mb: 'xs' }}
            value={startingHz}
            onChange={setStartingHz}
            placeholder="0.0"
            decimalScale={2} 
            allowDecimal={true}
            allowNegative={false}
        />
        <NumberInput
            label="Enter a target frequency (Hz)"
            labelProps={{ mb: 'xs' }}
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
      {/* show here only if frequency calculator was clicked */}
      {activeCalculator === 'hz' && <ResultDisplay />}
    </div>
    );
}