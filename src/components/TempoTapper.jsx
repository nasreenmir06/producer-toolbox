import { useState, useRef } from 'react';
import { Button, Text, Group } from '@mantine/core';
import { Mic, Square } from 'lucide-react';

export default function TempoTapper() {
    const [currentBPM, setCurrentBPM] = useState(null);
    const tapTimestamps = useRef([]);

    function calculateBPM(timestamps) {
        let intervals = [];
        for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i - 1]);
        }
        const avg = intervals.reduce((sum, num) => sum + num, 0) / intervals.length;
        return (60000/avg);
    }

    const recordTaps = () => {
        tapTimestamps.current.push(Date.now());
        if (tapTimestamps.current.length >= 2) {
            if (tapTimestamps.current.length > 5) {
                tapTimestamps.current.shift();
            }
            const bpm = calculateBPM(tapTimestamps.current);
            setCurrentBPM(Math.round(bpm));
        }
    };

    return (
    <div style={{ padding: '10px' }}>
      <Group mb="md"> 
        <Button color="red" onClick={recordTaps}>
            Tap Me!
        </Button>
      </Group>
      <Text>{currentBPM}</Text>
    </div>
    );
}