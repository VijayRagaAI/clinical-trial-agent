# Decision Algorithm Analysis

## Overview
Analysis of the confidence-weighted scoring algorithm for clinical trial eligibility evaluation implemented in `backend/eligibility_evaluator.py`.

## Algorithm Summary
```python
def decide(self, questions):
    # 1. Immediate-reject rule for high-priority failures
    for cat, result, conf in questions:
        if cat == 'high' and result == 'No' and conf >= 0.8:
            return 'Reject'
    
    # 2. Compute confidence-weighted score
    total = 0.0
    for cat, result, conf in questions:
        sign = +1 if result == 'Yes' else -1
        total += sign * conf * weights[cat]  # weights: high=5.0, medium=2.5, low=1.0
    
    # 3. Threshold decision
    return 'Accept' if total >= 0.0 else 'Reject'
```

## ✅ Pros (One-Liners)

1. **STT Uncertainty Handling**: Confidence weighting properly reduces impact of uncertain responses
2. **Clinical Compliance**: Hard rejection rules maintain safety for critical exclusion criteria  
3. **Simple & Interpretable**: O(n) algorithm with clear mathematical logic for clinical teams
4. **Balanced Priority Weighting**: 5:2.5:1 ratio appropriately reflects clinical importance levels
5. **Confidence-Proportional Impact**: Low confidence = low impact, honest about transcription quality

## ❌ Cons (One-Liners)

1. **Harsh Immediate Rejection**: Single high-priority failure ignores all compensating evidence
2. **Threshold Calibration Issues**: Same threshold (0.0) inappropriate for different study sizes  
3. **Asymmetric Confidence Treatment**: Low-confidence "Yes" vs "No" treated equally despite potential STT bias
4. **Edge Case Vulnerabilities**: All low-confidence responses or insufficient data still trigger decisions
5. **No Minimum Data Requirements**: Algorithm decides eligibility even with 1-2 criteria responses
6. **Binary High-Priority Logic**: Hard rejection vs. heavy weighting - no middle ground

## 🔧 Future Improvements

### High Priority
- Add minimum confidence threshold (e.g., require 3+ criteria with conf > 0.5)
- Normalize scores by total possible weight for consistent thresholding
- Implement "insufficient data" fallback state  

### Medium Priority
- Consider soft high-priority penalties instead of immediate rejection
- Add non-linear confidence curves for better uncertainty modeling
- Log edge cases for manual review triggers

### Low Priority
- Implement adaptive thresholds based on study characteristics
- Add confidence bias correction for STT directional errors
- Create confidence interval reporting for borderline cases

## Example Edge Cases

### Case 1: All Low Confidence
```python
questions = [('high', 'Yes', 0.2), ('high', 'Yes', 0.1), ('medium', 'No', 0.3)]
# Score: +1.0 + 0.5 - 0.75 = +0.75 → ACCEPT
# Issue: Decision based on highly uncertain data
```

### Case 2: Single High-Priority Failure
```python
questions = [('high', 'No', 0.9), ('high', 'Yes', 0.9), ('high', 'Yes', 0.9)]
# Result: IMMEDIATE REJECTION despite 2/3 high-priority success
# Issue: No consideration of compensating evidence
```

### Case 3: Variable Study Sizes
```python
Study A: 5 criteria, score range [-12.5, +12.5], threshold 0.0 = 50%
Study B: 20 criteria, score range [-50, +50], threshold 0.0 = 50%
# Issue: Same threshold represents different selectivity levels
```

## Implementation Notes

- Algorithm integrated with existing evaluation pipeline
- Maintains backward compatibility with legacy scoring
- Provides detailed confidence and weight reporting
- Constants are configurable via class initialization

## Configuration Parameters

```python
HIGH_PRIORITY_CONFIDENCE_THRESHOLD = 0.8  # Minimum confidence for immediate rejection
DECISION_THRESHOLD = 0.0                   # Score threshold for acceptance
weights = {
    'high': 5.0,
    'medium': 2.5,
    'low': 1.0
}
```

---
*Last Updated: December 2024*
*File: backend/eligibility_evaluator.py* 