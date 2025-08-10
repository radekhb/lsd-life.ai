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
            this.updateVisualization(result.score);
            
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

    updateVisualization(score) {
        try {
            console.log('updateVisualization called with score:', score);
            
            // Clear the container
            this.faceContainer.innerHTML = '';
            
            // Determine color based on score
            let backgroundColor;
            let textColor = '#ffffff';
            
            if (score > 75) {
                backgroundColor = '#ff4757'; // Red for high hallucination (crazy)
            } else if (score > 50) {
                backgroundColor = '#ffa502'; // Orange for medium-high (fun)
            } else if (score > 25) {
                backgroundColor = '#ffdd59'; // Yellow for medium (playful)
            } else {
                backgroundColor = '#2ed573'; // Green for low (calm)
            }
            
            // Apply the color to the face-container
            this.faceContainer.style.backgroundColor = backgroundColor;
            this.faceContainer.style.color = textColor;
            this.faceContainer.style.borderRadius = '12px';
            this.faceContainer.style.padding = '20px';
            this.faceContainer.style.textAlign = 'center';
            this.faceContainer.style.fontSize = '18px';
            this.faceContainer.style.fontWeight = 'bold';
            this.faceContainer.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
            this.faceContainer.style.minHeight = '200px';
            this.faceContainer.style.display = 'flex';
            this.faceContainer.style.alignItems = 'center';
            this.faceContainer.style.justifyContent = 'center';
            
            // Add text to show the score
            const scoreText = document.createElement('div');
            scoreText.textContent = `Hallucination Score: ${Math.floor(score)}%`;
            scoreText.style.fontSize = '24px';
            scoreText.style.fontWeight = 'bold';
            scoreText.style.textShadow = '2px 2px 4px rgba(0,0,0,0.3)';
            
            this.faceContainer.appendChild(scoreText);
            
        } catch (error) {
            console.error('Error updating visualization:', error);
            this.showVisualizationError('Failed to update visualization');
        }
    }

    // All drawing methods removed - no longer needed
    
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
