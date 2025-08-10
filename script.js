class HallucinationDetector {
    constructor() {
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.textInput = document.getElementById('text-input');
        this.analyzeBtn = document.getElementById('analyze-btn');
        this.resultsSection = document.getElementById('results-section');
        this.scoreValue = document.getElementById('score-value');
        this.faceContainer = document.querySelector('.face-container');
        this.analysisDetails = document.getElementById('analysis-details');
    }

    bindEvents() {
        // Analyze button
        this.analyzeBtn.addEventListener('click', () => this.analyzeContent());
    }

    async analyzeContent() {
        const content = this.textInput.value.trim();
        
        if (!content) {
            alert('Please enter some content to analyze.');
            return;
        }

        // Validate content length
        if (content.length < 10) {
            alert('Please enter at least 10 characters for meaningful analysis.');
            return;
        }

        this.setLoading(true);
        
        try {
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Analysis timed out. Please try again.')), 30000); // 30 second timeout
            });
            
            const analysisPromise = this.callHallucinationAPI(content);
            
            const result = await Promise.race([analysisPromise, timeoutPromise]);
            
            if (result && typeof result.score === 'number') {
                this.displayResults(result);
            } else {
                throw new Error('Invalid analysis result received');
            }
        } catch (error) {
            console.error('Analysis failed:', error);
            
            // Show error in results section instead of just alerting
            this.showErrorResult(error.message || 'Analysis failed. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    async callHallucinationAPI(content) {
        // Multiple approaches for hallucination detection without user API keys
        
        // Method 1: Try to use a free AI detection API (if available)
        try {
            const result = await this.tryFreeAIAPI(content);
            if (result) {
                return result;
            }
        } catch (error) {
            console.log('Free API not available, trying local analysis');
        }
        
        // Method 2: Use sophisticated local analysis
        try {
            return this.advancedLocalAnalysis(content);
        } catch (error) {
            console.error('Local analysis failed:', error);
            throw new Error('Analysis failed. Please try again with different content.');
        }
    }

    async tryFreeAIAPI(content) {
        // Try to use free AI detection APIs (these are examples - you'd need to implement real ones)
        
        // Option 1: Hugging Face Inference API (free tier available)
        // Note: This requires a valid API token from Hugging Face
        try {
            // Check if we have a valid token (you can set this in browser console or environment)
            const token = localStorage.getItem('hf_token') || 'hf_xxx';
            
            if (token === 'hf_xxx') {
                console.log('No valid Hugging Face token found, skipping API call');
                return null;
            }
            
            const response = await fetch('https://api-inference.huggingface.co/models/facebook/roberta-base-openai-detector', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ inputs: content })
            });
            
            if (response.ok) {
                const data = await response.json();
                return this.parseHuggingFaceResponse(data, content);
            } else {
                console.log('Hugging Face API response not ok:', response.status);
                return null;
            }
        } catch (error) {
            console.log('Hugging Face API not available:', error.message);
        }
        
        // Option 2: Try other free APIs (you can add more here)
        
        return null;
    }

    parseHuggingFaceResponse(data, content) {
        // Parse Hugging Face API response
        if (data && data.length > 0) {
            const scores = data[0];
            const aiScore = scores.find(s => s.label === 'LABEL_1')?.score || 0;
            const humanScore = scores.find(s => s.label === 'LABEL_0')?.score || 0;
            
            const hallucinationScore = Math.round(aiScore * 100);
            
            return {
                score: hallucinationScore,
                analysis: {
                    confidence: Math.round((aiScore + humanScore) * 100),
                    factors: this.generateFactorsFromScore(hallucinationScore),
                    recommendations: this.generateRecommendationsFromScore(hallucinationScore),
                    analysis: `AI detection analysis completed using Hugging Face model`
                }
            };
        }
        
        return null;
    }

    advancedLocalAnalysis(content) {
        try {
            // Sophisticated local analysis using multiple detection methods
            const analysis = {
                score: 0,
                factors: [],
                recommendations: [],
                confidence: 85
            };
            
            // Method 1: Language Pattern Analysis
            try {
                const patternScore = this.analyzeLanguagePatterns(content);
                analysis.score += patternScore.score;
                analysis.factors.push(...patternScore.factors);
            } catch (error) {
                console.warn('Language pattern analysis failed:', error);
                analysis.factors.push('Language pattern analysis unavailable');
            }
            
            // Method 2: Statistical Analysis
            try {
                const statisticalScore = this.analyzeStatisticalFeatures(content);
                analysis.score += statisticalScore.score;
                analysis.factors.push(...statisticalScore.factors);
            } catch (error) {
                console.warn('Statistical analysis failed:', error);
                analysis.factors.push('Statistical analysis unavailable');
            }
            
            // Method 3: Semantic Analysis
            try {
                const semanticScore = this.analyzeSemanticFeatures(content);
                analysis.score += semanticScore.score;
                analysis.factors.push(...semanticScore.factors);
            } catch (error) {
                console.warn('Semantic analysis failed:', error);
                analysis.factors.push('Semantic analysis unavailable');
            }
            
            // Method 4: Readability and Complexity Analysis
            try {
                const readabilityScore = this.analyzeReadabilityFeatures(content);
                analysis.score += readabilityScore.score;
                analysis.factors.push(...readabilityScore.factors);
            } catch (error) {
                console.warn('Readability analysis failed:', error);
                analysis.factors.push('Readability analysis unavailable');
            }
            
            // Normalize score to 0-100 range with more aggressive scaling
            analysis.score = Math.min(100, Math.max(0, analysis.score));
            
            // Boost score for very short content (likely AI-generated)
            if (content.length < 100) {
                analysis.score = Math.min(100, analysis.score + 15);
                analysis.factors.push('Very short content detected (potential AI-generated)');
            }
            
            // Boost score for very long content with consistent patterns
            if (content.length > 1000 && analysis.factors.length > 3) {
                analysis.score = Math.min(100, analysis.score + 10);
                analysis.factors.push('Long content with multiple AI patterns detected');
            }
            
            // Generate recommendations based on final score
            analysis.recommendations = this.generateRecommendationsFromScore(analysis.score);
            
            return {
                score: analysis.score,
                analysis: {
                    confidence: analysis.confidence,
                    factors: analysis.factors.length > 0 ? analysis.factors : ['Content analysis completed'],
                    recommendations: analysis.recommendations,
                    analysis: 'Advanced local analysis completed using multiple detection methods'
                }
            };
        } catch (error) {
            console.error('Advanced local analysis failed:', error);
            throw new Error('Local analysis failed. Please try again.');
        }
    }

    analyzeLanguagePatterns(content) {
        let score = 0;
        const factors = [];
        const words = content.toLowerCase().split(/\s+/);
        
        // 1. AI-generated language patterns - MORE AGGRESSIVE
        const aiPatterns = [
            'furthermore', 'moreover', 'additionally', 'in conclusion', 'to summarize',
            'it is important to note', 'it should be mentioned', 'as previously stated',
            'in terms of', 'with regard to', 'in the context of', 'it is worth noting',
            'on the other hand', 'conversely', 'nevertheless', 'however',
            'in light of', 'considering', 'given that', 'as such', 'therefore',
            'thus', 'hence', 'consequently', 'accordingly', 'subsequently',
            'meanwhile', 'further', 'moreover', 'besides', 'likewise',
            'similarly', 'in addition', 'not only', 'but also', 'as well as',
            'in order to', 'so as to', 'with the aim of', 'for the purpose of',
            'it can be argued', 'it is evident', 'it is clear', 'it is obvious',
            'as a result', 'due to', 'because of', 'owing to', 'thanks to'
        ];
        
        const aiPatternCount = aiPatterns.filter(pattern => 
            content.toLowerCase().includes(pattern)
        ).length;
        
        // MUCH MORE AGGRESSIVE SCORING
        if (aiPatternCount > 0) {
            score += Math.min(40, aiPatternCount * 8);
            factors.push(`AI-generated language patterns detected (${aiPatternCount} instances)`);
        }
        
        // 2. Repetitive phrases and structures - MORE SENSITIVE
        const phraseCounts = {};
        for (let i = 0; i < words.length - 2; i++) {
            const phrase = words.slice(i, i + 3).join(' ');
            phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
        }
        
        const repetitivePhrases = Object.values(phraseCounts).filter(count => count > 1).length;
        if (repetitivePhrases > 1) {
            score += Math.min(35, repetitivePhrases * 5);
            factors.push(`Repetitive language patterns found (${repetitivePhrases} instances)`);
        }
        
        // 3. Hedging language analysis - MORE AGGRESSIVE
        const hedgingWords = ['might', 'could', 'possibly', 'perhaps', 'maybe', 'seems', 'appears', 'likely', 'probably', 'potentially', 'arguably', 'presumably', 'supposedly', 'allegedly'];
        const hedgingCount = hedgingWords.filter(word => 
            content.toLowerCase().includes(word)
        ).length;
        
        if (hedgingCount > 1) {
            score += Math.min(25, hedgingCount * 4);
            factors.push(`Hedging language detected (${hedgingCount} instances)`);
        }
        
        // 4. NEW: Formal academic language patterns
        const formalPatterns = ['in accordance with', 'pursuant to', 'with respect to', 'in relation to', 'in reference to', 'in regard to', 'as per', 'pertaining to', 'concerning', 'regarding'];
        const formalCount = formalPatterns.filter(pattern => 
            content.toLowerCase().includes(pattern)
        ).length;
        
        if (formalCount > 0) {
            score += Math.min(20, formalCount * 6);
            factors.push(`Formal academic language patterns detected (${formalCount} instances)`);
        }
        
        return { score, factors };
    }

    analyzeStatisticalFeatures(content) {
        let score = 0;
        const factors = [];
        const words = content.toLowerCase().split(/\s+/);
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // 1. Sentence length variation - MORE SENSITIVE
        const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
        const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
        const sentenceVariance = sentenceLengths.reduce((sum, length) => sum + Math.pow(length - avgSentenceLength, 2), 0) / sentenceLengths.length;
        
        if (sentenceVariance < 15 && sentenceLengths.length > 3) {
            score += 25;
            factors.push('Unusually consistent sentence lengths detected');
        }
        
        // 2. Word frequency analysis - MORE AGGRESSIVE
        const wordFreq = {};
        words.forEach(word => {
            if (word.length > 2) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        });
        
        const highFreqWords = Object.entries(wordFreq).filter(([word, count]) => count > 2);
        if (highFreqWords.length > 2) {
            score += 20;
            factors.push(`High word repetition detected (${highFreqWords.length} frequently used words)`);
        }
        
        // 3. Punctuation patterns - MORE SENSITIVE
        const punctuationPatterns = content.match(/[.!?]+/g) || [];
        const unusualPunctuation = punctuationPatterns.filter(p => p.length > 1).length;
        if (unusualPunctuation > 1) {
            score += 15;
            factors.push('Unusual punctuation patterns detected');
        }
        
        // 4. NEW: Paragraph structure analysis
        const paragraphs = content.split(/\n\s*\n/);
        if (paragraphs.length > 2) {
            const paragraphLengths = paragraphs.map(p => p.split(/\s+/).length);
            const avgParagraphLength = paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length;
            const paragraphVariance = paragraphLengths.reduce((sum, length) => sum + Math.pow(length - avgParagraphLength, 2), 0) / paragraphLengths.length;
            
            if (paragraphVariance < 20) {
                score += 18;
                factors.push('Unusually consistent paragraph lengths detected');
            }
        }
        
        return { score, factors };
    }

    analyzeSemanticFeatures(content) {
        let score = 0;
        const factors = [];
        
        // 1. Factual claims detection - MORE AGGRESSIVE
        const factualClaims = content.match(/\d{4}|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}|\d+%|\d+\.\d+/g) || [];
        if (factualClaims.length > 2) {
            score += Math.min(25, factualClaims.length * 4);
            factors.push(`Multiple factual claims detected (${factualClaims.length} instances)`);
        }
        
        // 2. Technical jargon and complexity - MORE SENSITIVE
        const technicalTerms = content.match(/\b[A-Z]{2,}\b|\b[a-z]+[A-Z][a-z]+\b/g) || [];
        if (technicalTerms.length > 4) {
            score += 18;
            factors.push('High technical jargon usage detected');
        }
        
        // 3. Emotional language analysis - MORE AGGRESSIVE
        const emotionalWords = ['amazing', 'incredible', 'fantastic', 'terrible', 'horrible', 'wonderful', 'excellent', 'outstanding', 'remarkable', 'extraordinary', 'phenomenal', 'spectacular'];
        const emotionalCount = emotionalWords.filter(word => 
            content.toLowerCase().includes(word)
        ).length;
        
        if (emotionalCount > 1) {
            score += Math.min(20, emotionalCount * 5);
            factors.push('High emotional language usage detected');
        }
        
        // 4. NEW: Overly descriptive language
        const descriptiveWords = ['comprehensive', 'thorough', 'detailed', 'extensive', 'elaborate', 'comprehensive', 'systematic', 'methodical', 'rigorous', 'meticulous'];
        const descriptiveCount = descriptiveWords.filter(word => 
            content.toLowerCase().includes(word)
        ).length;
        
        if (descriptiveCount > 0) {
            score += Math.min(15, descriptiveCount * 5);
            factors.push('Overly descriptive language detected');
        }
        
        return { score, factors };
    }

    analyzeReadabilityFeatures(content) {
        let score = 0;
        const factors = [];
        const words = content.toLowerCase().split(/\s+/);
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // 1. Readability score - MORE AGGRESSIVE
        const avgWordsPerSentence = words.length / sentences.length;
        const avgSyllablesPerWord = this.estimateSyllables(words);
        
        if (avgWordsPerSentence > 20 || avgSyllablesPerWord > 1.6) {
            score += 20;
            factors.push('Complex sentence structure detected');
        }
        
        // 2. Vocabulary diversity - MORE SENSITIVE
        const uniqueWords = new Set(words.filter(word => word.length > 2));
        const vocabularyDiversity = uniqueWords.size / words.length;
        
        if (vocabularyDiversity < 0.4 && words.length > 30) {
            score += 18;
            factors.push('Low vocabulary diversity detected');
        }
        
        // 3. NEW: Sentence complexity analysis
        const complexSentences = sentences.filter(s => {
            const sentenceWords = s.split(/\s+/);
            return sentenceWords.length > 25 || s.includes(',') && s.split(',').length > 3;
        }).length;
        
        if (complexSentences > 1) {
            score += Math.min(15, complexSentences * 5);
            factors.push(`Complex sentence structures detected (${complexSentences} instances)`);
        }
        
        return { score, factors };
    }

    estimateSyllables(words) {
        // Simple syllable estimation
        let totalSyllables = 0;
        words.forEach(word => {
            const cleanWord = word.replace(/[^a-zA-Z]/g, '');
            if (cleanWord.length <= 3) {
                totalSyllables += 1;
            } else {
                const vowels = cleanWord.match(/[aeiouy]+/gi) || [];
                totalSyllables += Math.max(1, vowels.length);
            }
        });
        return totalSyllables / words.length;
    }

    generateFactorsFromScore(score) {
        const factors = [];
        
        if (score > 60) {
            factors.push('HIGH LIKELIHOOD of AI-generated content');
            factors.push('Multiple strong AI content markers detected');
            factors.push('Content shows typical AI writing patterns');
        } else if (score > 40) {
            factors.push('MODERATE to HIGH likelihood of AI-generated content');
            factors.push('Several AI content indicators present');
            factors.push('Content shows some AI writing characteristics');
        } else if (score > 20) {
            factors.push('MODERATE AI content indicators');
            factors.push('Some unusual patterns identified');
            factors.push('Content may be partially AI-generated');
        } else if (score > 10) {
            factors.push('Minor AI content markers detected');
            factors.push('Some patterns suggest AI involvement');
        } else {
            factors.push('Content appears to be human-generated');
            factors.push('Minimal AI content markers detected');
        }
        
        return factors;
    }

    generateRecommendationsFromScore(score) {
        const recommendations = [];
        
        if (score > 60) {
            recommendations.push('⚠️ HIGH LIKELIHOOD of AI-generated content');
            recommendations.push('Strongly recommend manual review for accuracy');
            recommendations.push('Cross-reference all factual claims with reliable sources');
            recommendations.push('Consider rewriting in more natural language');
        } else if (score > 40) {
            recommendations.push('⚠️ MODERATE to HIGH likelihood of AI-generated content');
            recommendations.push('Review for factual accuracy and natural flow');
            recommendations.push('Verify key claims and statements');
            recommendations.push('Consider human editing for authenticity');
        } else if (score > 20) {
            recommendations.push('⚠️ MODERATE AI content indicators');
            recommendations.push('Review for accuracy and natural language');
            recommendations.push('Some sections may need human revision');
        } else if (score > 10) {
            recommendations.push('Minor AI content markers detected');
            recommendations.push('Review for accuracy');
        } else {
            recommendations.push('Content appears to be human-generated');
            recommendations.push('Content looks good!');
        }
        
        return recommendations;
    }

    displayResults(result) {
        try {
            // Reset any previous error states
            this.resetErrorState();
            
            // Show results section
            this.resultsSection.style.display = 'block';
            
            // Update score
            this.scoreValue.textContent = `${Math.floor(result.score)}%`;
            this.scoreValue.style.color = '#667eea'; // Reset to normal color
            
            // Update visualization
            this.updateMushroomVisualization(result.score);
            
            // Update analysis details
            this.updateAnalysisDetails(result.analysis);
        } catch (error) {
            console.error('Error displaying results:', error);
            this.showErrorResult('Failed to display results');
        }
    }

    resetErrorState() {
        try {
            // Reset score color and remove error class
            this.scoreValue.style.color = '#667eea';
            this.scoreValue.classList.remove('error');
            
            // Show visualization container
            const faceContainer = document.querySelector('.face-container');
            if (faceContainer) {
                faceContainer.style.display = 'block';
            }
        } catch (error) {
            console.warn('Error resetting error state:', error);
        }
    }

    updateMushroomVisualization(score) {
        try {
            console.log('updateMushroomVisualization called with score:', score);
            const mushroomData = this.generateMushroomData(score);
            console.log('Generated mushroom data:', mushroomData);
            this.createMushroomVisualization(mushroomData);
        } catch (error) {
            console.error('Error updating mushroom visualization:', error);
            this.showVisualizationError('Failed to update visualization');
        }
    }

    generateMushroomData(score) {
        try {
            // Generate mushroom parameters based on hallucination score
            const intensity = score / 100;
            
            return {
                score: score,
                mushroomCount: Math.floor(score), // One mushroom per percentage point
                mushrooms: this.generateMushrooms(score),
                atmosphere: this.getAtmosphere(score)
            };
        } catch (error) {
            console.error('Error generating mushroom data:', error);
            // Return fallback data
            return {
                score: score,
                mushroomCount: 0,
                mushrooms: [],
                atmosphere: 'calm'
            };
        }
    }

    generateMushrooms(score) {
        try {
            const mushrooms = [];
            const count = Math.floor(score);
            
            // Mushroom colors for variety
            const colors = [
                '#FF6B6B', // Red
                '#4ECDC4', // Green
                '#8B4513', // Brown
                '#FFD93D', // Yellow
                '#6C5CE7', // Purple
                '#A8E6CF', // Light green
                '#FF8B94', // Pink
                '#FFA726', // Orange
                '#81C784', // Dark green
                '#F06292'  // Magenta
            ];
            
            // Mushroom shapes
            const shapes = ['round', 'tall', 'wide', 'spotted', 'striped', 'wavy'];
            
            // Calculate the total width available for mushrooms (80% of canvas width)
            const totalWidth = 320; // 400 * 0.8 = 320
            const startX = 40; // 20% margin from left
            const barHeight = 40;
            const startY = 180; // Center vertically (same as progress bar)
            
            // Calculate how much of the width should be filled based on score
            const fillWidth = (score / 100) * totalWidth;
            
            if (count > 0) {
                // Calculate spacing between mushrooms - ensure minimum spacing
                const minSpacing = 20;
                const maxSpacing = 35;
                const spacing = Math.max(minSpacing, Math.min(fillWidth / count, maxSpacing));
                
                for (let i = 0; i < count; i++) {
                    try {
                        // Position mushrooms from left to right along the progress bar
                        const x = startX + (i * spacing) + (spacing / 2);
                        
                        // Only place mushrooms if they fit within the fill width
                        if (x <= startX + fillWidth) {
                            // Position mushrooms around the progress bar area
                            const y = startY + (barHeight / 2) + (Math.random() - 0.5) * 50; // Random Y position around the bar
                            
                            const mushroom = {
                                id: i,
                                x: x,
                                y: y,
                                size: 6 + Math.random() * 8, // Smaller size range for progress bar
                                color: colors[Math.floor(Math.random() * colors.length)],
                                shape: shapes[Math.floor(Math.random() * shapes.length)],
                                rotation: Math.random() * 360, // Random rotation
                                spots: Math.random() > 0.5, // 50% chance of spots
                                stripes: Math.random() > 0.7, // 30% chance of stripes
                                wavy: Math.random() > 0.8, // 20% chance of wavy cap
                                glow: Math.random() > 0.9 // 10% chance of glow effect
                            };
                            mushrooms.push(mushroom);
                        }
                    } catch (error) {
                        console.warn('Error generating mushroom', i, ':', error);
                        // Continue with next mushroom
                    }
                }
            }
            
            return mushrooms;
        } catch (error) {
            console.error('Error generating mushrooms:', error);
            return []; // Return empty array if generation fails
        }
    }

    getAtmosphere(score) {
        try {
            if (score > 75) return 'crazy';
            if (score > 50) return 'fun';
            if (score > 25) return 'playful';
            return 'calm';
        } catch (error) {
            console.warn('Error getting atmosphere:', error);
            return 'calm'; // Default fallback
        }
    }

    createMushroomVisualization(mushroomData) {
        try {
            console.log('Creating mushroom visualization with score:', mushroomData.score);

            // Clear the container and any existing canvas
            this.faceContainer.innerHTML = '';
            
            if (!this.faceContainer) {
                console.error('Face container not found');
                return;
            }
            
            console.log('Face container:', this.faceContainer);
            
            // Remove any existing canvas
            const existingCanvas = this.faceContainer.querySelector('canvas');
            if (existingCanvas) {
                existingCanvas.remove();
                console.log('Removed existing canvas');
            }
            
            // Create a canvas for the mushroom visualization
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 400;
            canvas.style.width = '200px';
            canvas.style.height = '200px';
            canvas.style.borderRadius = '12px';
            canvas.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
            canvas.style.display = 'block';
            canvas.style.margin = '0 auto';
            canvas.style.backgroundColor = '#f0f8f0'; // Light green background for forest feel
            canvas.style.position = 'relative';
            canvas.style.zIndex = '1';
            
            // Append canvas to the face-container
            this.faceContainer.appendChild(canvas);
            
            console.log('Canvas created and appended to face container');
            console.log('Canvas element:', canvas);
            console.log('Canvas parent:', this.faceContainer);
            console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
            
            // Get the 2D context
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                console.error('Failed to get 2D context for canvas');
                return;
            }
            
            // Clear the canvas first
            ctx.clearRect(0, 0, 400, 400);
            
            // Draw the mushroom scene
            this.drawMushroomScene(ctx, mushroomData);
        } catch (error) {
            console.error('Error creating mushroom visualization:', error);
            // Show error in the visualization area
            this.showVisualizationError('Failed to create visualization');
        }
    }

    drawMushroomScene(ctx, mushroomData) {
        try {
            // Draw hallucinating background with psychedelic effects
            this.drawHallucinatingBackground(ctx, mushroomData.score);
            
            // Draw some grass at the bottom
            ctx.fillStyle = '#228B22';
            for (let i = 0; i < 20; i++) {
                const x = i * 20;
                const height = 20 + Math.random() * 30;
                ctx.fillRect(x, 400 - height, 15, height);
            }
            
            // Draw progress bar background
            this.drawProgressBarBackground(ctx, mushroomData.score);
            
            // Draw mushrooms
            if (mushroomData.mushrooms && Array.isArray(mushroomData.mushrooms)) {
                mushroomData.mushrooms.forEach(mushroom => {
                    try {
                        this.drawMushroom(ctx, mushroom);
                    } catch (error) {
                        console.warn('Error drawing mushroom:', error);
                        // Continue with other mushrooms
                    }
                });
            }
            
            // Add atmospheric effects based on score
            this.addAtmosphericEffects(ctx, mushroomData);
        } catch (error) {
            console.error('Error drawing mushroom scene:', error);
            // Draw a simple fallback scene
            this.drawFallbackScene(ctx);
        }
    }

    drawFallbackScene(ctx) {
        // Simple fallback scene if main drawing fails
        try {
            // Clear canvas with a simple background
            ctx.fillStyle = '#f0f8f0';
            ctx.fillRect(0, 0, 400, 400);
            
            // Draw a simple message
            ctx.fillStyle = '#333';
            ctx.font = '16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Visualization Error', 200, 180);
            ctx.fillText('Please try again', 200, 200);
        } catch (error) {
            console.error('Even fallback scene failed:', error);
        }
    }

    drawHallucinatingBackground(ctx, score) {
        try {
            const intensity = score / 100;
            
            // Create multiple gradient layers for psychedelic effect
            const time = Date.now() * 0.001;
            
            // Base gradient that shifts colors
            const baseGradient = ctx.createLinearGradient(0, 0, 400, 400);
            const hue1 = (time * 20 + score * 2) % 360;
            const hue2 = (time * 15 + score * 3 + 120) % 360;
            const hue3 = (time * 25 + score * 4 + 240) % 360;
            
            baseGradient.addColorStop(0, `hsl(${hue1}, 70%, 60%)`);
            baseGradient.addColorStop(0.3, `hsl(${hue2}, 80%, 50%)`);
            baseGradient.addColorStop(0.7, `hsl(${hue3}, 75%, 55%)`);
            baseGradient.addColorStop(1, `hsl(${hue1}, 70%, 60%)`);
            
            ctx.fillStyle = baseGradient;
            ctx.fillRect(0, 0, 400, 400);
            
            // Add swirling patterns
            this.drawSwirlingPatterns(ctx, score, time);
            
            // Add floating geometric shapes
            this.drawFloatingShapes(ctx, score, time);
            
            // Add wave effects
            this.drawWaveEffects(ctx, score, time);
            
            // Add color shifting overlay
            this.drawColorShiftOverlay(ctx, score, time);
        } catch (error) {
            console.warn('Error drawing hallucinating background:', error);
            // Fallback to simple background
            ctx.fillStyle = '#f0f8f0';
            ctx.fillRect(0, 0, 400, 400);
        }
    }

    drawSwirlingPatterns(ctx, score, time) {
        const intensity = score / 100;
        const numSwirls = Math.floor(3 + intensity * 5);
        
        for (let i = 0; i < numSwirls; i++) {
            const centerX = 200 + Math.sin(time * 0.5 + i) * 100;
            const centerY = 200 + Math.cos(time * 0.3 + i) * 100;
            const radius = 50 + Math.sin(time * 0.7 + i) * 30;
            
            ctx.beginPath();
            ctx.strokeStyle = `hsla(${(time * 30 + i * 60) % 360}, 80%, 60%, ${0.3 + intensity * 0.4})`;
            ctx.lineWidth = 2 + intensity * 3;
            
            for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
                const x = centerX + Math.cos(angle) * radius * (1 + Math.sin(angle * 3 + time) * 0.3);
                const y = centerY + Math.sin(angle) * radius * (1 + Math.cos(angle * 2 + time) * 0.3);
                
                if (angle === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
    }

    drawFloatingShapes(ctx, score, time) {
        const intensity = score / 100;
        const numShapes = Math.floor(5 + intensity * 10);
        
        for (let i = 0; i < numShapes; i++) {
            const x = 50 + Math.sin(time * 0.2 + i) * 300;
            const y = 50 + Math.cos(time * 0.3 + i) * 300;
            const size = 10 + Math.sin(time * 0.4 + i) * 20;
            const rotation = time * 0.5 + i;
            const hue = (time * 40 + i * 45) % 360;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            
            ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.4 + intensity * 0.4})`;
            
            // Draw different shapes
            switch (i % 4) {
                case 0: // Triangle
                    ctx.beginPath();
                    ctx.moveTo(0, -size);
                    ctx.lineTo(-size * 0.866, size * 0.5);
                    ctx.lineTo(size * 0.866, size * 0.5);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case 1: // Square
                    ctx.fillRect(-size/2, -size/2, size, size);
                    break;
                case 2: // Circle
                    ctx.beginPath();
                    ctx.arc(0, 0, size/2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 3: // Diamond
                    ctx.beginPath();
                    ctx.moveTo(0, -size/2);
                    ctx.lineTo(size/2, 0);
                    ctx.lineTo(0, size/2);
                    ctx.lineTo(-size/2, 0);
                    ctx.closePath();
                    ctx.fill();
                    break;
            }
            
            ctx.restore();
        }
    }

    drawWaveEffects(ctx, score, time) {
        const intensity = score / 100;
        const numWaves = Math.floor(2 + intensity * 3);
        
        for (let i = 0; i < numWaves; i++) {
            const y = 100 + i * 80;
            const amplitude = 20 + intensity * 30;
            const frequency = 0.02 + intensity * 0.03;
            const speed = 0.5 + intensity * 0.5;
            
            ctx.beginPath();
            ctx.strokeStyle = `hsla(${(time * 25 + i * 90) % 360}, 80%, 60%, ${0.3 + intensity * 0.4})`;
            ctx.lineWidth = 2 + intensity * 2;
            
            for (let x = 0; x < 400; x += 5) {
                const waveY = y + Math.sin(x * frequency + time * speed) * amplitude;
                if (x === 0) {
                    ctx.moveTo(x, waveY);
                } else {
                    ctx.lineTo(x, waveY);
                }
            }
            ctx.stroke();
        }
    }

    drawColorShiftOverlay(ctx, score, time) {
        const intensity = score / 100;
        
        // Create a radial gradient overlay that shifts colors
        const overlayGradient = ctx.createRadialGradient(200, 200, 0, 200, 200, 300);
        const hue1 = (time * 15) % 360;
        const hue2 = (time * 20 + 180) % 360;
        
        overlayGradient.addColorStop(0, `hsla(${hue1}, 60%, 70%, ${0.1 + intensity * 0.2})`);
        overlayGradient.addColorStop(0.5, `hsla(${hue2}, 70%, 60%, ${0.05 + intensity * 0.15})`);
        overlayGradient.addColorStop(1, `hsla(${hue1}, 60%, 70%, ${0.1 + intensity * 0.2})`);
        
        ctx.fillStyle = overlayGradient;
        ctx.fillRect(0, 0, 400, 400);
        
        // Add some pulsing circles
        if (intensity > 0.3) {
            const pulseRadius = 50 + Math.sin(time * 3) * 20;
            const pulseGradient = ctx.createRadialGradient(200, 200, 0, 200, 200, pulseRadius);
            pulseGradient.addColorStop(0, `hsla(${(time * 30) % 360}, 80%, 60%, ${0.3 * intensity})`);
            pulseGradient.addColorStop(1, `hsla(${(time * 30) % 360}, 80%, 60%, 0)`);
            
            ctx.fillStyle = pulseGradient;
            ctx.beginPath();
            ctx.arc(200, 200, pulseRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawProgressBarBackground(ctx, score) {
        // Calculate progress bar dimensions
        const barWidth = 320; // 80% of canvas width
        const barHeight = 40;
        const startX = 40; // 20% margin from left
        const startY = 180; // Center vertically
        
        // Draw background bar with gradient that matches the hallucinating theme
        const bgGradient = ctx.createLinearGradient(startX, startY, startX, startY + barHeight);
        bgGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        bgGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        bgGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        
        ctx.fillStyle = bgGradient;
        ctx.fillRect(startX, startY, barWidth, barHeight);
        
        // Draw border with shadow effect
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, startY, barWidth, barHeight);
        
        // Draw progress fill with psychedelic gradient
        const fillWidth = (score / 100) * barWidth;
        if (fillWidth > 0) {
            const time = Date.now() * 0.001;
            const progressGradient = ctx.createLinearGradient(startX, startY, startX + fillWidth, startY);
            const hue1 = (time * 30) % 360;
            const hue2 = (time * 30 + 60) % 360;
            const hue3 = (time * 30 + 120) % 360;
            
            progressGradient.addColorStop(0, `hsla(${hue1}, 80%, 60%, 0.6)`);
            progressGradient.addColorStop(0.5, `hsla(${hue2}, 80%, 60%, 0.4)`);
            progressGradient.addColorStop(1, `hsla(${hue3}, 80%, 60%, 0.6)`);
            
            ctx.fillStyle = progressGradient;
            ctx.fillRect(startX, startY, fillWidth, barHeight);
            
            // Add some sparkle effects to the progress bar
            if (score > 50) {
                for (let i = 0; i < 3; i++) {
                    const sparkleX = startX + Math.random() * fillWidth;
                    const sparkleY = startY + Math.random() * barHeight;
                    const sparkleSize = 2 + Math.random() * 3;
                    const sparkleHue = (time * 50 + i * 120) % 360;
                    
                    ctx.fillStyle = `hsl(${sparkleHue}, 100%, 70%)`;
                    ctx.beginPath();
                    ctx.arc(sparkleX, sparkleY, sparkleSize, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }
        
        // Draw percentage text with shadow and color shift
        const time = Date.now() * 0.001;
        const textHue = (time * 20) % 360;
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        ctx.fillStyle = `hsl(${textHue}, 80%, 60%)`;
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${score}%`, startX + barWidth / 2, startY + barHeight / 2 + 5);
        ctx.shadowBlur = 0;
    }

    drawMushroom(ctx, mushroom) {
        ctx.save();
        ctx.translate(mushroom.x, mushroom.y);
        ctx.rotate(mushroom.rotation * Math.PI / 180);
        
        // Add glow effect for hallucinating background
        if (mushroom.glow) {
            ctx.shadowColor = mushroom.color;
            ctx.shadowBlur = 15;
            ctx.globalAlpha = 0.8;
        }
        
        // Draw mushroom stem with gradient
        const stemGradient = ctx.createLinearGradient(0, 0, 0, mushroom.size * 1.5);
        stemGradient.addColorStop(0, '#8B4513'); // Brown
        stemGradient.addColorStop(1, '#654321'); // Darker brown
        
        ctx.fillStyle = stemGradient;
        ctx.fillRect(-mushroom.size/4, 0, mushroom.size/2, mushroom.size * 1.5);
        
        // Add stem texture
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const y = mushroom.size * 0.3 + i * mushroom.size * 0.3;
            ctx.beginPath();
            ctx.moveTo(-mushroom.size/4, y);
            ctx.lineTo(mushroom.size/4, y);
            ctx.stroke();
        }
        
        // Draw mushroom cap based on shape
        switch (mushroom.shape) {
            case 'round':
                this.drawRoundCap(ctx, mushroom);
                break;
            case 'tall':
                this.drawTallCap(ctx, mushroom);
                break;
            case 'wide':
                this.drawWideCap(ctx, mushroom);
                break;
            case 'spotted':
                this.drawSpottedCap(ctx, mushroom);
                break;
            case 'striped':
                this.drawStripedCap(ctx, mushroom);
                break;
            case 'wavy':
                this.drawWavyCap(ctx, mushroom);
                break;
            default:
                this.drawRoundCap(ctx, mushroom);
        }
        
        // Add spots if needed
        if (mushroom.spots) {
            this.addSpots(ctx, mushroom);
        }
        
        // Add stripes if needed
        if (mushroom.stripes) {
            this.addStripes(ctx, mushroom);
        }
        
        // Add glow effect if needed
        if (mushroom.glow) {
            this.addGlowEffect(ctx, mushroom);
        }
        
        ctx.restore();
    }

    drawRoundCap(ctx, mushroom) {
        // Create gradient for the cap
        const capGradient = ctx.createRadialGradient(0, -mushroom.size/2, 0, 0, -mushroom.size/2, mushroom.size);
        capGradient.addColorStop(0, this.lightenColor(mushroom.color, 0.3));
        capGradient.addColorStop(0.7, mushroom.color);
        capGradient.addColorStop(1, this.darkenColor(mushroom.color, 0.3));
        
        ctx.fillStyle = capGradient;
        ctx.beginPath();
        ctx.ellipse(0, -mushroom.size/2, mushroom.size, mushroom.size/2, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add highlight
        const highlightGradient = ctx.createRadialGradient(-mushroom.size/3, -mushroom.size/2 - 2, 0, -mushroom.size/3, -mushroom.size/2 - 2, mushroom.size/3);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.ellipse(-mushroom.size/3, -mushroom.size/2 - 2, mushroom.size/3, mushroom.size/6, 0, 0, 2 * Math.PI);
        ctx.fill();
    }

    drawTallCap(ctx, mushroom) {
        ctx.fillStyle = mushroom.color;
        ctx.beginPath();
        ctx.ellipse(0, -mushroom.size/2, mushroom.size/2, mushroom.size, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add highlight
        ctx.fillStyle = this.lightenColor(mushroom.color, 0.3);
        ctx.beginPath();
        ctx.ellipse(-mushroom.size/4, -mushroom.size/2 - 2, mushroom.size/4, mushroom.size/3, 0, 0, 2 * Math.PI);
        ctx.fill();
    }

    drawWideCap(ctx, mushroom) {
        ctx.fillStyle = mushroom.color;
        ctx.beginPath();
        ctx.ellipse(0, -mushroom.size/2, mushroom.size * 1.2, mushroom.size/3, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add highlight
        ctx.fillStyle = this.lightenColor(mushroom.color, 0.3);
        ctx.beginPath();
        ctx.ellipse(-mushroom.size/2, -mushroom.size/2 - 2, mushroom.size/2, mushroom.size/6, 0, 0, 2 * Math.PI);
        ctx.fill();
    }

    drawSpottedCap(ctx, mushroom) {
        // Draw base cap
        this.drawRoundCap(ctx, mushroom);
        
        // Add spots
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 5; i++) {
            const spotX = (Math.random() - 0.5) * mushroom.size;
            const spotY = -mushroom.size/2 + (Math.random() - 0.5) * mushroom.size/2;
            const spotSize = 2 + Math.random() * 3;
            
            ctx.beginPath();
            ctx.arc(spotX, spotY, spotSize, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    drawStripedCap(ctx, mushroom) {
        // Draw base cap
        this.drawRoundCap(ctx, mushroom);
        
        // Add stripes
        ctx.strokeStyle = this.darkenColor(mushroom.color, 0.4);
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const y = -mushroom.size/2 + (i - 1) * mushroom.size/4;
            ctx.beginPath();
            ctx.moveTo(-mushroom.size, y);
            ctx.lineTo(mushroom.size, y);
            ctx.stroke();
        }
    }

    drawWavyCap(ctx, mushroom) {
        ctx.fillStyle = mushroom.color;
        ctx.beginPath();
        
        // Create wavy cap
        const points = [];
        for (let angle = 0; angle <= Math.PI; angle += 0.1) {
            const x = Math.cos(angle) * mushroom.size;
            const wave = Math.sin(angle * 3) * 5;
            const y = -mushroom.size/2 + Math.sin(angle) * mushroom.size/2 + wave;
            points.push({x, y});
        }
        
        // Draw the wavy cap
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Add highlight
        ctx.fillStyle = this.lightenColor(mushroom.color, 0.3);
        ctx.beginPath();
        ctx.ellipse(-mushroom.size/3, -mushroom.size/2 - 2, mushroom.size/3, mushroom.size/6, 0, 0, 2 * Math.PI);
        ctx.fill();
    }

    addSpots(ctx, mushroom) {
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 3; i++) {
            const spotX = (Math.random() - 0.5) * mushroom.size;
            const spotY = -mushroom.size/2 + (Math.random() - 0.5) * mushroom.size/2;
            const spotSize = 1 + Math.random() * 2;
            
            ctx.beginPath();
            ctx.arc(spotX, spotY, spotSize, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    addStripes(ctx, mushroom) {
        ctx.strokeStyle = this.darkenColor(mushroom.color, 0.4);
        ctx.lineWidth = 1;
        for (let i = 0; i < 2; i++) {
            const y = -mushroom.size/2 + (i - 0.5) * mushroom.size/2;
            ctx.beginPath();
            ctx.moveTo(-mushroom.size/2, y);
            ctx.lineTo(mushroom.size/2, y);
            ctx.stroke();
        }
    }

    addGlowEffect(ctx, mushroom) {
        ctx.shadowColor = mushroom.color;
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 0.7;
        
        // Redraw the cap with glow
        this.drawRoundCap(ctx, mushroom);
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    addAtmosphericEffects(ctx, mushroomData) {
        const atmosphere = mushroomData.atmosphere;
        
        switch (atmosphere) {
            case 'crazy':
                this.addCrazyEffects(ctx);
                break;
            case 'fun':
                this.addFunEffects(ctx);
                break;
            case 'playful':
                this.addPlayfulEffects(ctx);
                break;
            default:
                this.addCalmEffects(ctx);
        }
    }

    addCrazyEffects(ctx) {
        const time = Date.now() * 0.001;
        
        // Add rainbow colors and sparkles
        for (let i = 0; i < 25; i++) {
            const x = Math.random() * 400;
            const y = Math.random() * 400;
            const size = 2 + Math.random() * 4;
            const hue = (time * 50 + i * 15) % 360;
            
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fill();
            
            // Add sparkle effect
            if (Math.random() > 0.7) {
                ctx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x - size - 2, y);
                ctx.lineTo(x + size + 2, y);
                ctx.moveTo(x, y - size - 2);
                ctx.lineTo(x, y + size + 2);
                ctx.stroke();
            }
        }
        
        // Add some wavy lines that move
        ctx.strokeStyle = `hsl(${time * 30 % 360}, 100%, 60%)`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 50 + i * 60);
            for (let x = 0; x < 400; x += 10) {
                const y = 50 + i * 60 + Math.sin(x * 0.02 + time * 2) * 20;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        // Add some floating hearts
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 400;
            const y = Math.random() * 400;
            this.drawHeart(ctx, x, y, 3 + Math.random() * 3);
        }
        
        // Add some rotating stars
        for (let i = 0; i < 6; i++) {
            const x = 100 + Math.sin(time * 0.5 + i) * 200;
            const y = 100 + Math.cos(time * 0.3 + i) * 200;
            this.drawRotatingStar(ctx, x, y, 5 + Math.random() * 5, time + i);
        }
    }

    drawRotatingStar(ctx, x, y, size, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        ctx.fillStyle = `hsl(${rotation * 30 % 360}, 100%, 60%)`;
        ctx.beginPath();
        
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            const outerX = Math.cos(angle) * size;
            const outerY = Math.sin(angle) * size;
            const innerX = Math.cos(angle + Math.PI / 5) * (size * 0.5);
            const innerY = Math.sin(angle + Math.PI / 5) * (size * 0.5);
            
            if (i === 0) {
                ctx.moveTo(outerX, outerY);
            } else {
                ctx.lineTo(outerX, outerY);
            }
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawHeart(ctx, x, y, size) {
        const time = Date.now() * 0.001;
        const hue = (time * 40) % 360;
        
        ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
        ctx.beginPath();
        ctx.moveTo(x, y + size);
        ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size);
        ctx.bezierCurveTo(x - size, y + size * 2, x, y + size * 3, x, y + size * 3);
        ctx.bezierCurveTo(x, y + size * 2, x + size, y + size * 2, x + size, y + size);
        ctx.bezierCurveTo(x + size, y, x, y, x, y + size);
        ctx.fill();
    }

    addFunEffects(ctx) {
        const time = Date.now() * 0.001;
        
        // Add some floating bubbles with color shifts
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * 400;
            const y = Math.random() * 400;
            const size = 3 + Math.random() * 5;
            const hue = (time * 20 + i * 36) % 360;
            
            ctx.fillStyle = `hsla(${hue}, 80%, 70%, 0.3)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.strokeStyle = `hsla(${hue}, 80%, 70%, 0.6)`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // Add some floating orbs
        for (let i = 0; i < 5; i++) {
            const x = 50 + Math.sin(time * 0.3 + i) * 300;
            const y = 50 + Math.cos(time * 0.2 + i) * 300;
            const size = 8 + Math.sin(time * 0.5 + i) * 4;
            const hue = (time * 15 + i * 72) % 360;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.8)`);
            gradient.addColorStop(1, `hsla(${hue}, 100%, 70%, 0.2)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    addPlayfulEffects(ctx) {
        const time = Date.now() * 0.001;
        
        // Add some small stars with twinkling effect
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 400;
            const y = Math.random() * 400;
            const size = 2 + Math.sin(time * 2 + i) * 1;
            const hue = (time * 25 + i * 45) % 360;
            
            ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Add some floating particles
        for (let i = 0; i < 12; i++) {
            const x = Math.random() * 400;
            const y = Math.random() * 400;
            const size = 1 + Math.random() * 2;
            const hue = (time * 30 + i * 30) % 360;
            
            ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.6)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    addCalmEffects(ctx) {
        const time = Date.now() * 0.001;
        
        // Add some gentle floating particles with subtle color shifts
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 400;
            const y = Math.random() * 400;
            const size = 1 + Math.random() * 2;
            const hue = (time * 10 + i * 72) % 360;
            
            ctx.fillStyle = `hsla(${hue}, 60%, 70%, 0.4)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Add some subtle wave lines
        for (let i = 0; i < 2; i++) {
            const y = 150 + i * 100;
            const amplitude = 5 + Math.sin(time * 0.5 + i) * 3;
            
            ctx.beginPath();
            ctx.strokeStyle = `hsla(${time * 15 % 360}, 60%, 70%, 0.3)`;
            ctx.lineWidth = 1;
            
            for (let x = 0; x < 400; x += 10) {
                const waveY = y + Math.sin(x * 0.02 + time) * amplitude;
                if (x === 0) {
                    ctx.moveTo(x, waveY);
                } else {
                    ctx.lineTo(x, waveY);
                }
            }
            ctx.stroke();
        }
    }

    lightenColor(color, factor) {
        // Simple color lightening utility
        try {
            const hex = color.replace('#', '');
            if (hex.length !== 6) return color; // Fallback for invalid colors
            
            const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + (255 - parseInt(hex.substr(0, 2), 16)) * factor);
            const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + (255 - parseInt(hex.substr(2, 2), 16)) * factor);
            const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + (255 - parseInt(hex.substr(4, 2), 16)) * factor);
            return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
        } catch (error) {
            console.warn('Error lightening color:', error);
            return color; // Return original color if processing fails
        }
    }

    darkenColor(color, factor) {
        // Simple color darkening utility
        try {
            const hex = color.replace('#', '');
            if (hex.length !== 6) return color; // Fallback for invalid colors
            
            const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
            const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
            const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));
            return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
        } catch (error) {
            console.warn('Error darkening color:', error);
            return color; // Return original color if processing fails
        }
    }

    updateAnalysisDetails(analysis) {
        try {
            if (!analysis) {
                console.warn('No analysis data provided');
                this.analysisDetails.innerHTML = '<div class="error-message">No analysis data available</div>';
                return;
            }
            
            const detailsHTML = `
                <div class="analysis-item">
                    <strong>Confidence Level:</strong> ${analysis.confidence || 'N/A'}%
                </div>
                <div class="analysis-item">
                    <strong>Key Factors:</strong>
                    <ul>
                        ${(analysis.factors || []).map(factor => `<li>${factor}</li>`).join('')}
                    </ul>
                </div>
                <div class="analysis-item">
                    <strong>Recommendations:</strong>
                    <ul>
                        ${(analysis.recommendations || []).map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            `;
            
            this.analysisDetails.innerHTML = detailsHTML;
        } catch (error) {
            console.error('Error updating analysis details:', error);
            this.analysisDetails.innerHTML = '<div class="error-message">Error displaying analysis details</div>';
        }
    }

    setLoading(loading) {
        try {
            const btnText = this.analyzeBtn.querySelector('.btn-text');
            const btnLoading = this.analyzeBtn.querySelector('.btn-loading');
            
            if (loading) {
                if (btnText) btnText.style.display = 'none';
                if (btnLoading) btnLoading.style.display = 'flex';
                this.analyzeBtn.disabled = true;
                this.analyzeBtn.textContent = 'Analyzing...';
            } else {
                if (btnText) btnText.style.display = 'block';
                if (btnLoading) btnLoading.style.display = 'none';
                this.analyzeBtn.disabled = false;
                this.analyzeBtn.textContent = 'Analyze Content';
            }
        } catch (error) {
            console.warn('Error setting loading state:', error);
            // Fallback: just disable/enable the button
            this.analyzeBtn.disabled = loading;
            this.analyzeBtn.textContent = loading ? 'Analyzing...' : 'Analyze Content';
        }
    }

    showErrorResult(errorMessage) {
        // Show results section with error
        this.resultsSection.style.display = 'block';
        
        // Update score to show error
        this.scoreValue.textContent = 'Error';
        this.scoreValue.style.color = '#dc3545';
        this.scoreValue.classList.add('error'); // Add error class
        
        // Show error message in analysis details
        this.analysisDetails.innerHTML = `
            <h3>Analysis Error</h3>
            <div class="details-content">
                <div class="error-message">
                    <strong>Error:</strong> ${errorMessage}
                </div>
                <div class="error-suggestions">
                    <h4>Suggestions:</h4>
                    <ul>
                        <li>Check your internet connection</li>
                        <li>Try with shorter content</li>
                        <li>Ensure content is in English</li>
                        <li>Try again in a few moments</li>
                    </ul>
                </div>
            </div>
        `;
        
        // Hide visualization on error
        const faceContainer = document.querySelector('.face-container');
        if (faceContainer) {
            faceContainer.style.display = 'none';
        }
    }

    showVisualizationError(errorMessage) {
        try {
            // Show a simple error message in the visualization area
            const faceContainer = document.querySelector('.face-container');
            if (faceContainer) {
                faceContainer.innerHTML = `
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 200px;
                        background: #f8d7da;
                        border: 1px solid #f5c6cb;
                        border-radius: 12px;
                        color: #721c24;
                        text-align: center;
                        padding: 20px;
                    ">
                        <div>
                            <strong>Visualization Error</strong><br>
                            ${errorMessage}<br>
                            <small>Try refreshing the page</small>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error showing visualization error:', error);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HallucinationDetector();
});
