# 📊 Data Update Instructions

## 🔄 How to Update Dashboard Data

### Method 1: Manual Refresh (Recommended for now)

1. **Update your Excel file**: 
   - Edit the `marketing_data.xlsm` file in the project folder
   - Save your changes

2. **Run the refresh script**:
   ```bash
   node manual-refresh.js
   ```

3. **Refresh the dashboard**:
   - Click the "Refresh Data" button in the browser
   - Or simply refresh the page (F5)

### Method 2: Upload New File

1. Click "Upload Excel" button in the dashboard
2. Select or drag your Excel file
3. Wait for processing to complete
4. Dashboard will automatically refresh

## 📋 Required Excel Structure

Your Excel file should contain these sheets:

- **`Clients_info（new）`** - Main client data with columns:
  - No. (Client number)
  - Broker (Broker name)
  - 日期 (Date)
  - 微信 (WeChat)
  - 来源 (Source)

- **`weekly_data`** - Weekly metrics with columns:
  - Week
  - 消费总额（aud) (Total cost in AUD)
  - Leads总数 (Total leads)
  - Leads单价（aud） (Lead price in AUD)

- **`monthly_data`** - Monthly cost data with columns:
  - 月份 (Month)
  - 消费总额（aud) (Total cost in AUD)

- **`monthly_count`** - Monthly count data with columns:
  - Month
  - Count

- **`database_marketing`** - Daily cost data with columns:
  - 时间 (Time/Date)
  - 消费 (Cost)

## 🚀 Quick Start for Weekly Meetings

1. Update `marketing_data.xlsm` with latest data
2. Run: `node manual-refresh.js`
3. Click "Refresh Data" button
4. Your dashboard is now updated with latest data!

## ⚠️ Troubleshooting

- If refresh button doesn't work, try refreshing the page manually
- Make sure Excel file is saved and not open in Excel
- Check that all required sheets exist in your Excel file
- Verify column names match the expected format

## 📝 Notes

- The manual-refresh.js script is a temporary solution
- Future updates will include automatic Excel file monitoring
- Always backup your Excel file before making changes