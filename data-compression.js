/**
 * Data Compression Utility
 * Compresses JSON data using LZString for efficient storage
 */

class DataCompression {
    constructor() {
        // Check if LZString is available (we'll load it from CDN)
        this.compressionAvailable = false;
        this.initPromise = this.init();
    }

    async init() {
        // Load LZString library if not already loaded
        if (typeof LZString !== 'undefined') {
            this.compressionAvailable = true;
            return true;
        }

        try {
            // Load LZString from CDN
            await this.loadScript('https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js');
            this.compressionAvailable = typeof LZString !== 'undefined';
            console.log('✅ Compression library loaded');
            return this.compressionAvailable;
        } catch (e) {
            console.warn('⚠️ Compression not available, using uncompressed data');
            this.compressionAvailable = false;
            return false;
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Compress JSON data
     */
    async compress(data) {
        await this.initPromise;

        if (!this.compressionAvailable) {
            return {
                compressed: false,
                data: data
            };
        }

        try {
            const jsonString = JSON.stringify(data);
            const compressed = LZString.compressToUTF16(jsonString);

            // Calculate compression ratio
            const originalSize = new Blob([jsonString]).size;
            const compressedSize = new Blob([compressed]).size;
            const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

            console.log(`📦 Compressed: ${originalSize} → ${compressedSize} bytes (${ratio}% reduction)`);

            return {
                compressed: true,
                data: compressed,
                originalSize,
                compressedSize,
                ratio
            };
        } catch (e) {
            console.error('Compression error:', e);
            return {
                compressed: false,
                data: data
            };
        }
    }

    /**
     * Decompress data
     */
    async decompress(compressedData) {
        await this.initPromise;

        if (!compressedData.compressed || !this.compressionAvailable) {
            return compressedData.data;
        }

        try {
            const decompressed = LZString.decompressFromUTF16(compressedData.data);
            return JSON.parse(decompressed);
        } catch (e) {
            console.error('Decompression error:', e);
            // Fallback to original data if decompression fails
            return compressedData.data;
        }
    }

    /**
     * Get size of data in bytes
     */
    getSize(data) {
        const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
        return new Blob([jsonString]).size;
    }

    /**
     * Check if data should be compressed (> 10KB)
     */
    shouldCompress(data) {
        return this.getSize(data) > 10240; // 10KB threshold
    }

    /**
     * Compress deck if needed
     */
    async compressDeck(deck) {
        const size = this.getSize(deck);

        // Only compress if deck is larger than 10KB
        if (size > 10240) {
            const result = await this.compress(deck);
            return {
                id: deck.id,
                title: deck.title,
                subject: deck.subject,
                created: deck.created,
                _compressed: result.compressed,
                _data: result.data,
                _stats: {
                    originalSize: result.originalSize,
                    compressedSize: result.compressedSize,
                    ratio: result.ratio
                }
            };
        }

        // Return uncompressed for small decks
        return deck;
    }

    /**
     * Decompress deck if needed
     */
    async decompressDeck(deck) {
        if (deck._compressed) {
            const decompressed = await this.decompress({
                compressed: true,
                data: deck._data
            });
            return decompressed;
        }
        return deck;
    }

    /**
     * Split large deck into chunks for Firebase (1MB limit per document)
     */
    splitDeckForFirebase(deck) {
        const MAX_SIZE = 950000; // 950KB to stay under 1MB Firestore limit
        const deckSize = this.getSize(deck);

        if (deckSize < MAX_SIZE) {
            return [deck]; // No need to split
        }

        // Split cards into chunks
        const chunks = [];
        const cardsPerChunk = Math.ceil(deck.cards.length / Math.ceil(deckSize / MAX_SIZE));

        for (let i = 0; i < deck.cards.length; i += cardsPerChunk) {
            const chunkCards = deck.cards.slice(i, i + cardsPerChunk);
            chunks.push({
                id: `${deck.id}_chunk_${chunks.length}`,
                parentId: deck.id,
                chunkIndex: chunks.length,
                totalChunks: Math.ceil(deck.cards.length / cardsPerChunk),
                title: deck.title,
                subject: deck.subject,
                description: deck.description,
                cards: chunkCards,
                created: deck.created
            });
        }

        console.log(`📦 Split large deck into ${chunks.length} chunks`);
        return chunks;
    }

    /**
     * Combine chunked deck back together
     */
    combineDeckChunks(chunks) {
        if (chunks.length === 1 && !chunks[0].parentId) {
            return chunks[0]; // Not chunked
        }

        // Sort by chunk index
        chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

        // Combine cards
        const allCards = [];
        chunks.forEach(chunk => {
            allCards.push(...chunk.cards);
        });

        // Return combined deck
        const firstChunk = chunks[0];
        return {
            id: firstChunk.parentId || firstChunk.id,
            title: firstChunk.title,
            subject: firstChunk.subject,
            description: firstChunk.description,
            cards: allCards,
            created: firstChunk.created
        };
    }
}

// Create global instance
window.dataCompression = new DataCompression();
