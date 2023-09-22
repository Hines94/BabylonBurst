#pragma once

namespace MathUtils {
    bool IsAbsLess(float val, float margin);

    float RoundToDecimalPlaces(float val, int dp);

    double ExponentialMovingAverage(double current, double newVal, double alpha);

} // namespace MathUtils