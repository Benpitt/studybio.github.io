/**
 * Wikimedia Commons Image Search Service
 * Provides functionality to search and retrieve images from Wikimedia Commons
 */

const sanitizeHtml = require('sanitize-html');
class WikimediaService {
    constructor() {
        this.apiUrl = 'https://commons.wikimedia.org/w/api.php';
        this.defaultLimit = 6; // Number of images to return
    }

    /**
     * Search for images on Wikimedia Commons
     * @param {string} searchTerm - The search query
     * @param {number} limit - Maximum number of results (default: 6)
     * @returns {Promise<Array>} Array of image objects
     */
    async searchImages(searchTerm, limit = this.defaultLimit) {
        if (!searchTerm || searchTerm.trim().length === 0) {
            return [];
        }

        try {
            // First, search for pages matching the term
            const searchParams = new URLSearchParams({
                action: 'query',
                format: 'json',
                generator: 'search',
                gsrsearch: `${searchTerm} filetype:bitmap|drawing`,
                gsrnamespace: '6', // File namespace
                gsrlimit: String(limit * 2), // Get more results to filter
                prop: 'imageinfo|info',
                iiprop: 'url|size|mime|extmetadata',
                iiurlwidth: '300', // Thumbnail width
                origin: '*' // Enable CORS
            });

            const response = await fetch(`${this.apiUrl}?${searchParams}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.query || !data.query.pages) {
                return [];
            }

            // Process and filter results
            const images = Object.values(data.query.pages)
                .filter(page => {
                    // Filter out non-image files and invalid entries
                    if (!page.imageinfo || page.imageinfo.length === 0) return false;
                    const mime = page.imageinfo[0].mime;
                    return mime && (mime.startsWith('image/'));
                })
                .slice(0, limit) // Limit to requested number
                .map(page => {
                    const info = page.imageinfo[0];
                    const metadata = info.extmetadata || {};

                    return {
                        title: page.title.replace('File:', ''),
                        pageId: page.pageid,
                        thumbnailUrl: info.thumburl || info.url,
                        fullUrl: info.url,
                        width: info.width,
                        height: info.height,
                        thumbWidth: info.thumbwidth,
                        thumbHeight: info.thumbheight,
                        description: this.extractDescription(metadata),
                        artist: this.extractArtist(metadata),
                        license: this.extractLicense(metadata)
                    };
                });

            return images;
        } catch (error) {
            console.error('Error searching Wikimedia images:', error);
            return [];
        }
    }

    /**
     * Extract description from metadata
     * @private
     */
    extractDescription(metadata) {
        if (metadata.ImageDescription && metadata.ImageDescription.value) {
            // Remove HTML tags and truncate
            const desc = sanitizeHtml(metadata.ImageDescription.value, { allowedTags: [], allowedAttributes: {} })
                .trim();
            return desc.length > 100 ? desc.substring(0, 100) + '...' : desc;
        }
        return '';
    }

    /**
     * Extract artist/author from metadata
     * @private
     */
    extractArtist(metadata) {
        if (metadata.Artist && metadata.Artist.value) {
            return sanitizeHtml(metadata.Artist.value, { allowedTags: [], allowedAttributes: {} }).trim();
        }
        return 'Unknown';
    }

    /**
     * Extract license info from metadata
     * @private
     */
    extractLicense(metadata) {
        if (metadata.LicenseShortName && metadata.LicenseShortName.value) {
            return metadata.LicenseShortName.value;
        }
        return 'Unknown license';
    }

    /**
     * Get a direct image URL for a specific file
     * @param {string} filename - The filename (with or without 'File:' prefix)
     * @returns {Promise<string|null>} The image URL or null
     */
    async getImageUrl(filename) {
        try {
            // Ensure filename has File: prefix
            const file = filename.startsWith('File:') ? filename : `File:${filename}`;

            const params = new URLSearchParams({
                action: 'query',
                format: 'json',
                titles: file,
                prop: 'imageinfo',
                iiprop: 'url',
                origin: '*'
            });

            const response = await fetch(`${this.apiUrl}?${params}`);
            const data = await response.json();

            if (data.query && data.query.pages) {
                const page = Object.values(data.query.pages)[0];
                if (page.imageinfo && page.imageinfo.length > 0) {
                    return page.imageinfo[0].url;
                }
            }

            return null;
        } catch (error) {
            console.error('Error getting image URL:', error);
            return null;
        }
    }
}

// Create singleton instance
const wikimediaService = new WikimediaService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = wikimediaService;
}
