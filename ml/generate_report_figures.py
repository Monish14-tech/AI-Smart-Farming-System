import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 11

OUTPUT_DIR = r"C:\Users\MONISH\.gemini\antigravity-ide\brain\912779b4-276a-4c64-99c1-3182e900c158"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MARKET_CSV = os.path.join(BASE_DIR, 'market_transactions.csv')
FREIGHT_CSV = os.path.join(BASE_DIR, 'freight_pricing.csv')

# Load data
df = pd.read_csv(MARKET_CSV)
X = pd.get_dummies(df[['crop_name', 'grade', 'quantity_kg', 'month', 'base_price', 'perishability']], drop_first=False)
y = df['fair_price_kg']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train models
rf = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)
rf.fit(X_train, y_train)
y_pred_rf = rf.predict(X_test)
r2_rf = r2_score(y_test, y_pred_rf)
mae_rf = mean_absolute_error(y_test, y_pred_rf)
rmse_rf = np.sqrt(mean_squared_error(y_test, y_pred_rf))

ridge = Ridge(alpha=1.0)
ridge.fit(X_train, y_train)
y_pred_ridge = ridge.predict(X_test)
r2_ridge = r2_score(y_test, y_pred_ridge)
mae_ridge = mean_absolute_error(y_test, y_pred_ridge)
rmse_ridge = np.sqrt(mean_squared_error(y_test, y_pred_ridge))

df_freight = pd.read_csv(FREIGHT_CSV)
X_f = pd.get_dummies(df_freight[['distance_km', 'cargo_weight_kg', 'perishability', 'vehicle_type']], drop_first=False)
y_f = df_freight['fair_freight']
X_train_f, X_test_f, y_train_f, y_test_f = train_test_split(X_f, y_f, test_size=0.2, random_state=42)
gb = GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42)
gb.fit(X_train_f, y_train_f)
y_pred_gb = gb.predict(X_test_f)
r2_gb = r2_score(y_test_f, y_pred_gb)
mae_gb = mean_absolute_error(y_test_f, y_pred_gb)
rmse_gb = np.sqrt(mean_squared_error(y_test_f, y_pred_gb))

# -------------------------------------------------------------
# 1. Figure 5.1 Training the Model
# -------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6), dpi=300)
fig.suptitle('Figure 5.1: Training the Machine Learning Valuation Models', fontsize=15, fontweight='bold', y=0.98)

# Gradient Boosting Training Deviance Loss
test_score = np.zeros((gb.n_estimators,), dtype=np.float64)
for i, y_pred in enumerate(gb.staged_predict(X_test_f)):
    test_score[i] = mean_squared_error(y_test_f, y_pred)

ax1.plot(np.arange(gb.n_estimators) + 1, gb.train_score_, 'b-', lw=2, label='Training Loss (MSE)')
ax1.plot(np.arange(gb.n_estimators) + 1, test_score, 'r--', lw=2, label='Validation Loss (MSE)')
ax1.set_title('Gradient Boosting Regressor Loss Convergence', fontsize=12, fontweight='bold')
ax1.set_xlabel('Boosting Iterations (Estimators)', fontsize=11)
ax1.set_ylabel('Mean Squared Error (MSE)', fontsize=11)
ax1.legend(loc='upper right', frameon=True)
ax1.grid(True, linestyle='--', alpha=0.6)

# Random Forest Cumulative OOB / Staged Performance
trees = np.arange(10, 110, 10)
rf_scores = []
for t in trees:
    sub_rf = RandomForestRegressor(n_estimators=t, max_depth=12, random_state=42, n_jobs=-1)
    sub_rf.fit(X_train, y_train)
    rf_scores.append(r2_score(y_test, sub_rf.predict(X_test)))

ax2.plot(trees, rf_scores, 'g-o', lw=2, markersize=6, label='Random Forest Test R²')
ax2.axhline(r2_ridge, color='orange', linestyle=':', lw=2, label=f'Ridge Baseline R² ({r2_ridge:.3f})')
ax2.set_title('Crop Valuation Random Forest Convergence across Estimators', fontsize=12, fontweight='bold')
ax2.set_xlabel('Number of Decision Trees (n_estimators)', fontsize=11)
ax2.set_ylabel('R² Evaluation Score', fontsize=11)
ax2.set_ylim([0.88, 0.95])
ax2.legend(loc='lower right', frameon=True)
ax2.grid(True, linestyle='--', alpha=0.6)

plt.tight_layout()
fig51_path = os.path.join(OUTPUT_DIR, "Figure_5_1_Training_the_Model.png")
plt.savefig(fig51_path, dpi=300, bbox_inches='tight')
plt.close()
print("Saved:", fig51_path)

# -------------------------------------------------------------
# 2. Fig 5.2 Model Performance Evaluation on Test Dataset
# -------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6), dpi=300)
fig.suptitle('Fig 5.2: Model Performance Evaluation on Test Dataset', fontsize=15, fontweight='bold', y=0.98)

# Scatter Actual vs Predicted
ax1.scatter(y_test, y_pred_rf, color='#2563EB', alpha=0.65, edgecolors='none', s=45, label='Test Observations')
min_val = min(y_test.min(), y_pred_rf.min())
max_val = max(y_test.max(), y_pred_rf.max())
ax1.plot([min_val, max_val], [min_val, max_val], 'r--', lw=2.5, label='Ideal Perfect Fit ($y = \\hat{y}$)')
ax1.set_title(f'Actual vs. Predicted Fair Price ($R^2 = {r2_rf:.4f}$)', fontsize=12, fontweight='bold')
ax1.set_xlabel('Actual Fair Price (₹/kg)', fontsize=11)
ax1.set_ylabel('Predicted Fair Price (₹/kg)', fontsize=11)
ax1.legend(loc='upper left', frameon=True)
ax1.grid(True, linestyle='--', alpha=0.6)

# Performance metrics box
metrics_text = f"Test Dataset Metrics:\n• R² Score: {r2_rf:.4f}\n• MAE: ₹{mae_rf:.2f}/kg\n• RMSE: ₹{rmse_rf:.2f}/kg\n• Total Test Samples: {len(y_test)}"
ax1.text(0.65, 0.10, metrics_text, transform=ax1.transAxes, fontsize=10,
         verticalalignment='bottom', bbox=dict(boxstyle='round,pad=0.5', facecolor='#F3F4F6', edgecolor='#D1D5DB', alpha=0.9))

# Residuals Histogram & KDE
residuals = y_test - y_pred_rf
ax2.hist(residuals, bins=25, color='#10B981', edgecolor='black', alpha=0.75, density=True, label='Residuals')
mu, std = residuals.mean(), residuals.std()
x_norm = np.linspace(residuals.min(), residuals.max(), 100)
p_norm = (1 / (std * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x_norm - mu) / std) ** 2)
ax2.plot(x_norm, p_norm, 'k-', lw=2, label=f'Normal Fit (μ={mu:.2f}, σ={std:.2f})')
ax2.axvline(0, color='red', linestyle='--', lw=1.5)
ax2.set_title('Prediction Error (Residuals) Distribution', fontsize=12, fontweight='bold')
ax2.set_xlabel('Residual Error (Actual - Predicted) in ₹/kg', fontsize=11)
ax2.set_ylabel('Density Probability', fontsize=11)
ax2.legend(loc='upper right', frameon=True)
ax2.grid(True, linestyle='--', alpha=0.6)

plt.tight_layout()
fig52_path = os.path.join(OUTPUT_DIR, "Fig_5_2_Model_Performance_Evaluation_on_Test_Dataset.png")
plt.savefig(fig52_path, dpi=300, bbox_inches='tight')
plt.close()
print("Saved:", fig52_path)

# -------------------------------------------------------------
# 3. Figure 6.1 Machine Learning Performance
# -------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6), dpi=300)
fig.suptitle('Figure 6.1: Machine Learning Performance and Feature Importance', fontsize=15, fontweight='bold', y=0.98)

# Model Comparison Bar Chart
models = ['Ridge Baseline', 'Random Forest (Crop)', 'Gradient Boosting (Freight)']
r2_vals = [r2_ridge, r2_rf, r2_gb]
mae_vals = [mae_ridge, mae_rf, mae_gb]

x_pos = np.arange(len(models))
width = 0.35

rects1 = ax1.bar(x_pos - width/2, r2_vals, width, label='R² Score (Accuracy)', color='#3B82F6', edgecolor='black', alpha=0.85)
ax1_twin = ax1.twinx()
rects2 = ax1_twin.bar(x_pos + width/2, [mae_ridge, mae_rf, mae_gb / 20], width, label='MAE (Error)', color='#EF4444', edgecolor='black', alpha=0.85)

ax1.set_ylabel('R² Score (Higher is Better)', color='#1D4ED8', fontsize=11, fontweight='bold')
ax1_twin.set_ylabel('Mean Absolute Error (Lower is Better)', color='#B91C1C', fontsize=11, fontweight='bold')
ax1.set_xticks(x_pos)
ax1.set_xticklabels(models, fontsize=10, fontweight='bold')
ax1.set_ylim([0.85, 1.02])
ax1.set_title('Comparative Evaluation Across ML Architectures', fontsize=12, fontweight='bold')
ax1.grid(True, linestyle='--', alpha=0.5)

for rect in rects1:
    h = rect.get_height()
    ax1.annotate(f'{h:.3f}', xy=(rect.get_x() + rect.get_width() / 2, h),
                 xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=9, fontweight='bold')

# Feature Importances (Random Forest)
importances = rf.feature_importances_
feat_names = np.array(X.columns)
sorted_idx = np.argsort(importances)[-10:]

ax2.barh(np.arange(len(sorted_idx)), importances[sorted_idx], color='#8B5CF6', edgecolor='black', alpha=0.85)
ax2.set_yticks(np.arange(len(sorted_idx)))
ax2.set_yticklabels(feat_names[sorted_idx], fontsize=10)
ax2.set_title('Top 10 Feature Importances (Random Forest Regressor)', fontsize=12, fontweight='bold')
ax2.set_xlabel('Relative Gini Importance Score', fontsize=11)
ax2.grid(True, linestyle='--', alpha=0.6)

for i, v in enumerate(importances[sorted_idx]):
    ax2.text(v + 0.005, i, f"{v*100:.1f}%", va='center', fontsize=9, fontweight='bold', color='#4C1D95')

plt.tight_layout()
fig61_path = os.path.join(OUTPUT_DIR, "Figure_6_1_Machine_Learning_Performance.png")
plt.savefig(fig61_path, dpi=300, bbox_inches='tight')
plt.close()
print("Saved:", fig61_path)
