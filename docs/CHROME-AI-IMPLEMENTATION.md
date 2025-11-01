# Chrome Built-In AI Implementation Plan

## Current Status

**As of 2025-11-01:** Chrome Built-In AI features are **NOT implemented** in this extension, despite references in the code.

### What the Code References
The `lib/ai.js` file contains conditional checks for:
- `chrome.ai.summarizer` - For text summarization
- `chrome.ai.prompt` - For AI prompt generation

### What Actually Happens
All AI functions immediately fall back to simple text operations:
- `summarizeContent()` → Returns first 100 characters with "AI Summary:" prefix
- `generateProcessTag()` → Returns static tags: "AI-Summarized-Web-Page" or "File-Upload-Hashed"
- `generateCertificateSummary()` → Returns template string like "Certificate Summary for entry {id}"

**No actual AI processing occurs.**

## Research Required

### 1. Identify Actual Chrome AI APIs

The referenced APIs (`chrome.ai.*`) may not exist in the expected namespace. Research needed:

- **Chrome Built-In AI Documentation:**
  - Check official Chrome Developer documentation for AI APIs
  - Verify if APIs are available, experimental, or proposed
  - Identify correct namespace (may be `chrome.aiOriginTrial.*` or similar)

- **Browser Availability:**
  - Which Chrome versions support these APIs?
  - Are they limited to Chrome Canary/Dev channels?
  - Do they require origin trials or feature flags?

- **API Surface:**
  - What methods are actually available?
  - What parameters do they accept?
  - What do they return?
  - How do errors manifest?

### 2. Test on Chrome Canary/Dev

Set up testing environment:
1. Install Chrome Canary or Chrome Dev
2. Enable experimental AI features (if flag exists)
3. Test actual API availability
4. Document exact API signatures
5. Capture error messages and edge cases

### 3. Review Similar Extensions

Research other Chrome extensions using AI:
- How do they detect AI availability?
- What fallback strategies do they use?
- What error handling patterns work well?
- What user messaging is effective?

## Implementation Plan

### Phase 1: API Research & Validation (1-2 weeks)

**Tasks:**
- [ ] Research official Chrome AI documentation
- [ ] Test on Chrome Canary with experimental flags
- [ ] Document actual API namespace and methods
- [ ] Create proof-of-concept with real AI calls
- [ ] Identify browser version requirements
- [ ] Document API quota/limits if any

**Deliverables:**
- Technical specification document for Chrome AI APIs
- Proof-of-concept code demonstrating real AI integration
- Browser compatibility matrix

### Phase 2: Feature Detection (1 week)

**Tasks:**
- [ ] Implement robust feature detection for AI APIs
- [ ] Create detection util: `detectAICapabilities()`
- [ ] Handle multiple API namespaces (for future compatibility)
- [ ] Add user-facing messaging about AI availability
- [ ] Test detection across Chrome versions

**Example Implementation:**
```javascript
// lib/ai-detection.js
export async function detectAICapabilities() {
  const capabilities = {
    summarizer: false,
    promptGenerator: false,
    namespace: null,
  };

  // Check various possible namespaces
  const namespaces = [
    'chrome.ai',
    'chrome.aiOriginTrial',
    'window.ai',
  ];

  for (const ns of namespaces) {
    try {
      const api = eval(ns); // Or safer accessor
      if (api && api.summarizer) {
        capabilities.summarizer = true;
        capabilities.namespace = ns;
      }
      if (api && api.prompt) {
        capabilities.promptGenerator = true;
      }
    } catch (e) {
      // Namespace doesn't exist
    }
  }

  return capabilities;
}
```

### Phase 3: AI Integration (2-3 weeks)

**Tasks:**
- [ ] Refactor `lib/ai.js` to use real AI APIs
- [ ] Implement proper error handling
- [ ] Create three-tier fallback system:
  1. Chrome Built-In AI (best)
  2. Server-based AI API (optional, requires backend)
  3. Text extraction (current fallback)
- [ ] Add timeout handling for AI calls
- [ ] Implement retry logic for transient failures
- [ ] Add telemetry/logging for AI usage

**Updated Function Structure:**
```javascript
// lib/ai.js
export async function summarizeContent(text) {
  const capabilities = await detectAICapabilities();
  
  // Try Chrome Built-In AI
  if (capabilities.summarizer) {
    try {
      const api = getAIAPI(capabilities.namespace);
      const result = await api.summarizer.summarize({ 
        text,
        maxLength: 200,
        timeout: 5000 
      });
      return result.summary || fallbackSummary(text);
    } catch (error) {
      console.warn('Chrome AI summarization failed:', error);
      // Continue to fallback
    }
  }
  
  // Fallback to text extraction
  return fallbackSummary(text);
}

function fallbackSummary(text) {
  return `Extracted: ${text.slice(0, 100)}...`;
}
```

### Phase 4: Testing & Validation (1-2 weeks)

**Tasks:**
- [ ] Unit tests for AI functions with mocked Chrome APIs
- [ ] Integration tests with real Chrome Canary
- [ ] Test fallback behavior when AI unavailable
- [ ] Test with various content types and lengths
- [ ] Performance testing (AI calls may be slow)
- [ ] Error case testing (quota exceeded, timeouts, etc.)

**Test Matrix:**
| Browser | AI Available | Expected Behavior |
|---------|--------------|-------------------|
| Chrome Stable | No | Use fallback |
| Chrome Beta | Maybe | Detect & use if available |
| Chrome Dev | Maybe | Detect & use if available |
| Chrome Canary | Yes* | Use AI APIs |
| Other Browsers | No | Use fallback |

*Assuming experimental flags enabled

### Phase 5: User Experience (1 week)

**Tasks:**
- [ ] Add UI indicator for AI feature availability
- [ ] Show AI processing status in stepper
- [ ] Add preference toggle: "Use AI features if available"
- [ ] Display AI-generated vs fallback content differently
- [ ] Add help text explaining AI features
- [ ] Create demo/tutorial for AI features

**UI Mockup:**
```
┌─────────────────────────────────────┐
│ Step 4: Generate Metadata           │
│                                     │
│ ✓ AI Features: Enabled              │
│   Using Chrome Built-In AI          │
│                                     │
│ [ ] Prefer fallback (faster)        │
└─────────────────────────────────────┘
```

### Phase 6: Documentation (1 week)

**Tasks:**
- [ ] Update README.md with AI feature status
- [ ] Create AI features user guide
- [ ] Document browser requirements
- [ ] Add troubleshooting section for AI
- [ ] Update DEVELOPMENT-PLAN.md
- [ ] Create video demo showing AI in action

## Fallback Strategy

### Three-Tier System

1. **Chrome Built-In AI (Tier 1 - Best Quality)**
   - Use when available
   - Provides genuine AI summarization
   - Best user experience
   - May be slower (network/compute intensive)

2. **Text Extraction (Tier 2 - Current Implementation)**
   - Always available
   - Fast and reliable
   - Lower quality (no understanding)
   - Good enough for most use cases

3. **Static Defaults (Tier 3 - Minimal)**
   - Used when content unavailable
   - Better than nothing
   - Clear to user it's a placeholder

### Graceful Degradation

Users should get:
- Clear indication of which tier is active
- Option to retry with AI if fallback was used
- Consistent experience regardless of tier
- No errors or broken features

## Success Criteria

Implementation is complete when:
- [ ] Chrome AI APIs are correctly identified and documented
- [ ] Real AI integration works on supported browsers
- [ ] Feature detection is robust and accurate
- [ ] Fallback chain works seamlessly
- [ ] All tests pass
- [ ] Documentation is complete
- [ ] User feedback is positive
- [ ] No degradation for users without AI features

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| APIs don't exist yet | High | Use fallback tier system |
| APIs are unstable | Medium | Wrap in try-catch, implement timeouts |
| APIs require origin trial | Medium | Document requirements, guide users to enable |
| APIs have strict quotas | Medium | Implement rate limiting, cache results |
| Performance issues | Low | Add timeouts, show progress, allow skip |
| Browser compatibility | Low | Feature detection, fallback always available |

## Timeline Estimate

- **Research & Validation:** 1-2 weeks
- **Feature Detection:** 1 week
- **AI Integration:** 2-3 weeks
- **Testing:** 1-2 weeks
- **UX Polish:** 1 week
- **Documentation:** 1 week

**Total: 7-10 weeks** for complete implementation

## Alternative: Server-Side AI

If Chrome Built-In AI is not viable, consider:

### Option: Use OpenAI/Anthropic API
- Requires backend service (cost, privacy concerns)
- More reliable and consistent
- Works on all browsers
- Requires API key management
- May conflict with extension's local-first philosophy

### Option: Use Local AI Models (e.g., ONNX Runtime)
- Bundle small AI model with extension
- Works offline
- Larger extension size
- Slower on lower-end devices
- More complex implementation

**Recommendation:** Focus on Chrome Built-In AI first, as it aligns with the project's original vision and Chrome extension context.

## Next Steps

1. **Immediate:** Research Chrome Built-In AI API status (this week)
2. **Short-term:** Create proof-of-concept with real APIs (next 2 weeks)
3. **Medium-term:** Implement feature detection and integration (next 1-2 months)
4. **Long-term:** Polish UX and expand AI features (ongoing)

---

**Document Status:** Implementation plan created 2025-11-01  
**Next Review:** After Chrome AI API research is complete  
**Owner:** AI Integration Team Member
