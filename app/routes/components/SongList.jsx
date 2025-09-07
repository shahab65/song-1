import React, { useState, useRef } from 'react';
import {
    Card,
    Text,
    Page,
    Button,
    InlineGrid,
    BlockStack,
    Box,
    Icon,
} from '@shopify/polaris';
import { PlayIcon, PauseCircleIcon } from '@shopify/polaris-icons';
import { songs } from '../../constants/songs';

const SongList = () => {
    const [playingId, setPlayingId] = useState(null);
    const [selectedSongs, setSelectedSongs] = useState(new Set());
    const audioRefs = useRef({});

    const handlePlayPause = (song) => {
        const audio = audioRefs.current[song.id];
        if (!audio) return;

        if (playingId === song.id) {
            audio.pause();
            setPlayingId(null);
        } else {
            if (playingId && audioRefs.current[playingId]) {
                audioRefs.current[playingId].pause();
            }
            audio.play();
            setPlayingId(song.id);
        }
    };

    const handleSelect = (songId) => {
        const newSelected = new Set(selectedSongs);
        if (newSelected.has(songId)) {
            newSelected.delete(songId);
        } else {
            newSelected.add(songId);
        }
        setSelectedSongs(newSelected);
    };

    const renderCard = (song) => {
        const isPlaying = playingId === song.id;
        const isSelected = selectedSongs.has(song.id);

        return (
            <Card key={song.id}>
                <BlockStack gap="300" align="center">
                    {/* Thumbnail area with background */}
                    <Box
                        onClick={() => handlePlayPause(song)}
                        background="bg-fill-secondary" // Shopify design token
                        minHeight="40px"
                        padding="400"
                        hover={{ background: 'bg-fill-tertiary' }}
                        borderRadius="200"
                    >
                        <Icon
                            source={isPlaying ? PauseCircleIcon : PlayIcon}
                            tone={isPlaying ? 'primary' : 'base'}

                        />
                    </Box>

                    {/* Song name */}
                    <Text as="h3" variant="headingMd" alignment="center">
                        {song.displayName}
                    </Text>

                    {/* Select button */}
                    <Button
                        variant={isSelected ? 'primary' : 'secondary'}
                        fullWidth
                        onClick={() => handleSelect(song.id)}
                    >
                        {isSelected ? 'Selected' : 'Select'}
                    </Button>
                </BlockStack>

                <audio
                    ref={(el) => (audioRefs.current[song.id] = el)}
                    src={song.url}
                    onEnded={() => setPlayingId(null)}
                    preload="metadata"
                />
            </Card>
        );
    };

    return (
        <Page title="Sound Library">
            <InlineGrid columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap="400">
                {songs.map((song) => renderCard(song))}
            </InlineGrid>
        </Page>
    );
};

export default SongList;
