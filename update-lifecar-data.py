import csv
import os

# 输入输出文件路径
input_file = r"C:\Users\inter\Desktop\Weekly_Marketing\LifeX_Weekly_Marketing_dashboard\full data\账户-投放数据5.19-8.25.csv"
output_file = r"C:\Users\inter\Desktop\Weekly_Marketing\LifeX_Weekly_Marketing_dashboard\public\database_lifecar\lifecar-data.csv"
backup_file = r"C:\Users\inter\Desktop\Weekly_Marketing\LifeX_Weekly_Marketing_dashboard\public\database_lifecar\lifecar-data-backup.csv"

# 首先备份原文件
if os.path.exists(output_file):
    import shutil
    shutil.copy2(output_file, backup_file)
    print(f"Backed up old file to {backup_file}")

# 读取新数据
with open(input_file, 'r', encoding='utf-8-sig') as infile:
    reader = csv.DictReader(infile)
    rows = list(reader)

# 准备输出数据
output_rows = []

# 定义输出列
output_columns = [
    '时间', '消费', '展现量', '点击量', '点击率', '平均点击成本', '平均千次展现费用',
    '点赞', '评论', '收藏', '关注', '分享', '互动量', '平均互动成本',
    '行动按钮点击量', '行动按钮点击率', '截图', '保存图片',
    '搜索组件点击量', '搜索组件点击转化率', '平均搜后阅读笔记篇数', '搜后阅读量',
    '多转化人数（添加企微+私信咨询）', '多转化成本（添加企微+私信咨询）',
    '多转化人数（添加企微成功+私信留资）', '多转化成本（私信留资+添加企微成功）'
]

# 处理每一行数据（跳过汇总行）
for row in rows:
    if '合计' in row.get('时间', ''):
        continue
    
    # 转换日期格式：2025-05-19 -> 19/05/2025
    date_str = row['时间']
    if date_str:
        parts = date_str.split('-')
        if len(parts) == 3:
            formatted_date = f"{parts[2]}/{parts[1]}/{parts[0]}"
        else:
            formatted_date = date_str
    else:
        continue
    
    # 构建输出行
    output_row = {
        '时间': formatted_date,
        '消费': row.get('消费', '0'),
        '展现量': row.get('展现量', '0'),
        '点击量': row.get('点击量', '0'),
        '点击率': row.get('点击率', '0%').replace('%', '%'),  # 确保有%符号
        '平均点击成本': row.get('平均点击成本', '0'),
        '平均千次展现费用': row.get('平均千次展现费用', '0'),
        '点赞': row.get('点赞', '0'),
        '评论': row.get('评论', '0'),
        '收藏': row.get('收藏', '0'),
        '关注': row.get('关注', '0'),
        '分享': row.get('分享', '0'),
        '互动量': row.get('互动量', '0'),
        '平均互动成本': row.get('平均互动成本', '0'),
        '行动按钮点击量': row.get('行动按钮点击量', '0'),
        '行动按钮点击率': row.get('行动按钮点击率', '0%').replace('%', '%'),
        '截图': row.get('截图', '0'),
        '保存图片': row.get('保存图片', '0'),
        '搜索组件点击量': row.get('搜索组件点击量', '0'),
        '搜索组件点击转化率': row.get('搜索组件点击转化率', '0%').replace('%', '%'),
        '平均搜后阅读笔记篇数': row.get('平均搜后阅读笔记篇数', '0'),
        '搜后阅读量': row.get('搜后阅读量', '0'),
        '多转化人数（添加企微+私信咨询）': row.get('多转化人数（添加企微+私信咨询）', '0'),
        '多转化成本（添加企微+私信咨询）': row.get('多转化成本（添加企微+私信咨询）', '0'),
        '多转化人数（添加企微成功+私信留资）': row.get('多转化人数（添加企微成功+私信留资）', '0'),
        '多转化成本（私信留资+添加企微成功）': row.get('多转化成本（私信留资+添加企微成功）', '0')
    }
    
    # 将百分比格式化为带%号（如果还没有的话）
    for key in ['点击率', '行动按钮点击率', '搜索组件点击转化率']:
        value = output_row[key]
        if value and '%' not in value and value != '0':
            output_row[key] = value + '%'
        elif value == '0':
            output_row[key] = '0.00%'
    
    output_rows.append(output_row)

# 写入新文件
with open(output_file, 'w', encoding='utf-8-sig', newline='') as outfile:
    writer = csv.DictWriter(outfile, fieldnames=output_columns)
    writer.writeheader()
    writer.writerows(output_rows)

print(f"Successfully updated LifeCar data file with {len(output_rows)} rows")
print(f"Output file: {output_file}")