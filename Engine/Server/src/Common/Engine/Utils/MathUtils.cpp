#include "MathUtils.h"
#include <cmath>

bool MathUtils::IsAbsLess(float val, float margin) {
    return val < margin && val > -margin;
}

float MathUtils::RoundToDecimalPlaces(float val, int dp) {
    float factor = std::pow(10.0f, dp);
    return std::round(val * factor) / factor;
}

double MathUtils::ExponentialMovingAverage(double current, double newVal, double alpha) {
    return (1 - alpha) * current + alpha * newVal;
}
