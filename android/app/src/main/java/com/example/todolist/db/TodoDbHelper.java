package com.example.todolist.db;

import android.content.ContentValues;
import android.content.Context;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class TodoDbHelper extends SQLiteOpenHelper {

    private static final String TAG = "TodoDbHelper";
    private static final String DATABASE_NAME = "todos.db";
    private static final int DATABASE_VERSION = 2;

    public static final String TABLE_TODOS = "todos";
    public static final String COL_ID = "id";
    public static final String COL_TEXT = "text";
    public static final String COL_COMPLETED = "completed";
    public static final String COL_COMPLETED_AT = "completed_at";
    public static final String COL_CREATED_AT = "created_at";
    public static final String COL_UPDATED_AT = "updated_at";
    public static final String COL_DUE_AT = "due_at";
    public static final String COL_LOCATION = "location";
    public static final String COL_CATEGORY = "category";
    public static final String COL_PRIORITY = "priority";
    public static final String COL_NOTES = "notes";
    public static final String COL_DELETED_AT = "deleted_at";
    public static final String COL_IS_ROUTINE = "is_routine";
    public static final String COL_LAST_COMPLETED_DATE = "last_completed_date";

    private static final String OLD_PREFS_NAME = "todo_prefs";
    private static final String OLD_KEY_TODOS = "todos_json";
    private static final String KEY_MIGRATED_TO_SQLITE = "migrated_to_sqlite_v1";

    private static TodoDbHelper instance;

    public static synchronized TodoDbHelper getInstance(Context context) {
        if (instance == null) {
            instance = new TodoDbHelper(context.getApplicationContext());
        }
        return instance;
    }

    private TodoDbHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        String createTableSql = "CREATE TABLE IF NOT EXISTS " + TABLE_TODOS + " ("
                + COL_ID + " TEXT PRIMARY KEY, "
                + COL_TEXT + " TEXT NOT NULL, "
                + COL_COMPLETED + " INTEGER NOT NULL DEFAULT 0, "
                + COL_COMPLETED_AT + " INTEGER, "
                + COL_CREATED_AT + " INTEGER NOT NULL, "
                + COL_UPDATED_AT + " INTEGER NOT NULL, "
                + COL_DUE_AT + " TEXT, "
                + COL_LOCATION + " TEXT, "
                + COL_CATEGORY + " TEXT, "
                + COL_PRIORITY + " INTEGER NOT NULL DEFAULT 0, "
                + COL_NOTES + " TEXT, "
                + COL_DELETED_AT + " INTEGER, "
                + COL_IS_ROUTINE + " INTEGER NOT NULL DEFAULT 0, "
                + COL_LAST_COMPLETED_DATE + " TEXT"
                + ");";
        db.execSQL(createTableSql);

        // 创建复合索引，加速查询
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_todos_active_due ON " + TABLE_TODOS
                + " (" + COL_COMPLETED + ", " + COL_DUE_AT + ", " + COL_DELETED_AT + ");");
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_todos_created ON " + TABLE_TODOS
                + " (" + COL_CREATED_AT + " DESC);");
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_todos_routine ON " + TABLE_TODOS
                + " (" + COL_IS_ROUTINE + ", " + COL_COMPLETED + ");");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        if (oldVersion < 2) {
            try {
                db.execSQL("ALTER TABLE " + TABLE_TODOS + " ADD COLUMN " + COL_IS_ROUTINE + " INTEGER NOT NULL DEFAULT 0;");
                db.execSQL("ALTER TABLE " + TABLE_TODOS + " ADD COLUMN " + COL_LAST_COMPLETED_DATE + " TEXT;");
                db.execSQL("CREATE INDEX IF NOT EXISTS idx_todos_routine ON " + TABLE_TODOS
                        + " (" + COL_IS_ROUTINE + ", " + COL_COMPLETED + ");");
            } catch (Exception e) {
                Log.e(TAG, "Upgrade from v" + oldVersion + " to v" + newVersion + " failed", e);
            }
        }
    }

    /**
     * 自动从 SharedPreferences 迁移存量历史数据
     */
    public synchronized void checkAndMigrateFromSharedPrefs(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(OLD_PREFS_NAME, Context.MODE_PRIVATE);
        boolean alreadyMigrated = prefs.getBoolean(KEY_MIGRATED_TO_SQLITE, false);
        if (alreadyMigrated) {
            return;
        }

        String json = prefs.getString(OLD_KEY_TODOS, null);
        if (json == null || json.trim().isEmpty() || "[]".equals(json.trim())) {
            prefs.edit().putBoolean(KEY_MIGRATED_TO_SQLITE, true).apply();
            return;
        }

        try {
            JSONArray arr = new JSONArray(json);
            if (arr.length() > 0) {
                SQLiteDatabase db = getWritableDatabase();
                // 检查数据库当前是否已经有数据
                Cursor cursor = db.rawQuery("SELECT COUNT(*) FROM " + TABLE_TODOS, null);
                int count = 0;
                if (cursor.moveToFirst()) {
                    count = cursor.getInt(0);
                }
                cursor.close();

                if (count == 0) {
                    insertOrUpdateTodos(arr);
                    Log.i(TAG, "Successfully migrated " + arr.length() + " todos from SharedPreferences to SQLite.");
                }
            }
            prefs.edit().putBoolean(KEY_MIGRATED_TO_SQLITE, true).apply();
        } catch (Exception e) {
            Log.e(TAG, "Failed to migrate todos from SharedPreferences to SQLite", e);
        }
    }

    /**
     * 获取所有有效（未软删除）的任务 JSON 数组
     */
    public synchronized JSONArray getAllActiveTodosJson() {
        JSONArray result = new JSONArray();
        SQLiteDatabase db = getReadableDatabase();
        Cursor cursor = null;
        try {
            cursor = db.query(TABLE_TODOS, null,
                    COL_DELETED_AT + " IS NULL",
                    null, null, null,
                    COL_CREATED_AT + " DESC");

            while (cursor.moveToNext()) {
                JSONObject obj = new JSONObject();
                obj.put("id", cursor.getString(cursor.getColumnIndexOrThrow(COL_ID)));
                obj.put("text", cursor.getString(cursor.getColumnIndexOrThrow(COL_TEXT)));
                obj.put("completed", cursor.getInt(cursor.getColumnIndexOrThrow(COL_COMPLETED)) == 1);

                long completedAt = cursor.getLong(cursor.getColumnIndexOrThrow(COL_COMPLETED_AT));
                obj.put("completedAt", completedAt > 0 ? completedAt : JSONObject.NULL);

                obj.put("createdAt", cursor.getLong(cursor.getColumnIndexOrThrow(COL_CREATED_AT)));

                long updatedAt = cursor.getLong(cursor.getColumnIndexOrThrow(COL_UPDATED_AT));
                obj.put("updatedAt", updatedAt > 0 ? updatedAt : JSONObject.NULL);

                String dueAt = cursor.getString(cursor.getColumnIndexOrThrow(COL_DUE_AT));
                obj.put("dueAt", dueAt != null && !dueAt.isEmpty() ? dueAt : JSONObject.NULL);

                String location = cursor.getString(cursor.getColumnIndexOrThrow(COL_LOCATION));
                obj.put("location", location != null && !location.isEmpty() ? location : JSONObject.NULL);

                String category = cursor.getString(cursor.getColumnIndexOrThrow(COL_CATEGORY));
                obj.put("category", category != null && !category.isEmpty() ? category : JSONObject.NULL);

                obj.put("priority", cursor.getInt(cursor.getColumnIndexOrThrow(COL_PRIORITY)));

                String notes = cursor.getString(cursor.getColumnIndexOrThrow(COL_NOTES));
                obj.put("notes", notes != null && !notes.isEmpty() ? notes : JSONObject.NULL);

                obj.put("isRoutine", cursor.getInt(cursor.getColumnIndexOrThrow(COL_IS_ROUTINE)) == 1);

                String lastCompletedDate = cursor.getString(cursor.getColumnIndexOrThrow(COL_LAST_COMPLETED_DATE));
                obj.put("lastCompletedDate", lastCompletedDate != null && !lastCompletedDate.isEmpty() ? lastCompletedDate : JSONObject.NULL);

                result.put(obj);
            }
        } catch (Exception e) {
            Log.e(TAG, "getAllActiveTodosJson failed", e);
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
        return result;
    }

    /**
     * 全量同步任务列表：事务内更新/插入当前有效任务，并删除已不在列表中的已删除任务
     */
    public synchronized void syncTodos(JSONArray todos) {
        if (todos == null) return;
        SQLiteDatabase db = getWritableDatabase();
        db.beginTransaction();
        try {
            long now = System.currentTimeMillis();
            List<String> currentIds = new ArrayList<>();

            for (int i = 0; i < todos.length(); i++) {
                JSONObject obj = todos.getJSONObject(i);
                ContentValues cv = new ContentValues();

                String id = obj.getString("id");
                currentIds.add(id);

                cv.put(COL_ID, id);
                cv.put(COL_TEXT, obj.getString("text"));
                cv.put(COL_COMPLETED, obj.optBoolean("completed", false) ? 1 : 0);

                if (obj.has("completedAt") && !obj.isNull("completedAt")) {
                    cv.put(COL_COMPLETED_AT, obj.getLong("completedAt"));
                } else {
                    cv.putNull(COL_COMPLETED_AT);
                }

                long createdAt = obj.optLong("createdAt", now);
                cv.put(COL_CREATED_AT, createdAt);

                long updatedAt = obj.optLong("updatedAt", now);
                cv.put(COL_UPDATED_AT, updatedAt);

                if (obj.has("dueAt") && !obj.isNull("dueAt")) {
                    cv.put(COL_DUE_AT, obj.getString("dueAt"));
                } else {
                    cv.putNull(COL_DUE_AT);
                }

                if (obj.has("location") && !obj.isNull("location")) {
                    cv.put(COL_LOCATION, obj.getString("location"));
                } else {
                    cv.putNull(COL_LOCATION);
                }

                if (obj.has("category") && !obj.isNull("category")) {
                    cv.put(COL_CATEGORY, obj.getString("category"));
                } else {
                    cv.putNull(COL_CATEGORY);
                }

                cv.put(COL_PRIORITY, obj.optInt("priority", 0));

                if (obj.has("notes") && !obj.isNull("notes")) {
                    cv.put(COL_NOTES, obj.getString("notes"));
                } else {
                    cv.putNull(COL_NOTES);
                }

                if (obj.has("deletedAt") && !obj.isNull("deletedAt")) {
                    cv.put(COL_DELETED_AT, obj.getLong("deletedAt"));
                } else {
                    cv.putNull(COL_DELETED_AT);
                }

                cv.put(COL_IS_ROUTINE, obj.optBoolean("isRoutine", false) ? 1 : 0);

                if (obj.has("lastCompletedDate") && !obj.isNull("lastCompletedDate")) {
                    cv.put(COL_LAST_COMPLETED_DATE, obj.getString("lastCompletedDate"));
                } else {
                    cv.putNull(COL_LAST_COMPLETED_DATE);
                }

                db.insertWithOnConflict(TABLE_TODOS, null, cv, SQLiteDatabase.CONFLICT_REPLACE);
            }

            // 同步清理已删除任务：删除不在当前列表中的所有记录
            if (currentIds.isEmpty()) {
                db.delete(TABLE_TODOS, null, null);
            } else {
                StringBuilder placeholders = new StringBuilder();
                for (int i = 0; i < currentIds.size(); i++) {
                    placeholders.append("?");
                    if (i < currentIds.size() - 1) {
                        placeholders.append(",");
                    }
                }
                String[] args = currentIds.toArray(new String[0]);
                db.delete(TABLE_TODOS, COL_ID + " NOT IN (" + placeholders.toString() + ")", args);
            }

            db.setTransactionSuccessful();
        } catch (Exception e) {
            Log.e(TAG, "syncTodos transaction failed", e);
        } finally {
            db.endTransaction();
        }
    }

    /**
     * 事务批量增量/全量插入或更新任务（仅更新，不删除）
     */
    public synchronized void insertOrUpdateTodos(JSONArray todos) {
        if (todos == null) return;
        SQLiteDatabase db = getWritableDatabase();
        db.beginTransaction();
        try {
            long now = System.currentTimeMillis();
            for (int i = 0; i < todos.length(); i++) {
                JSONObject obj = todos.getJSONObject(i);
                ContentValues cv = new ContentValues();

                String id = obj.getString("id");
                cv.put(COL_ID, id);
                cv.put(COL_TEXT, obj.getString("text"));
                cv.put(COL_COMPLETED, obj.optBoolean("completed", false) ? 1 : 0);

                if (obj.has("completedAt") && !obj.isNull("completedAt")) {
                    cv.put(COL_COMPLETED_AT, obj.getLong("completedAt"));
                } else {
                    cv.putNull(COL_COMPLETED_AT);
                }

                long createdAt = obj.optLong("createdAt", now);
                cv.put(COL_CREATED_AT, createdAt);

                long updatedAt = obj.optLong("updatedAt", now);
                cv.put(COL_UPDATED_AT, updatedAt);

                if (obj.has("dueAt") && !obj.isNull("dueAt")) {
                    cv.put(COL_DUE_AT, obj.getString("dueAt"));
                } else {
                    cv.putNull(COL_DUE_AT);
                }

                if (obj.has("location") && !obj.isNull("location")) {
                    cv.put(COL_LOCATION, obj.getString("location"));
                } else {
                    cv.putNull(COL_LOCATION);
                }

                if (obj.has("category") && !obj.isNull("category")) {
                    cv.put(COL_CATEGORY, obj.getString("category"));
                } else {
                    cv.putNull(COL_CATEGORY);
                }

                cv.put(COL_PRIORITY, obj.optInt("priority", 0));

                if (obj.has("notes") && !obj.isNull("notes")) {
                    cv.put(COL_NOTES, obj.getString("notes"));
                } else {
                    cv.putNull(COL_NOTES);
                }

                if (obj.has("deletedAt") && !obj.isNull("deletedAt")) {
                    cv.put(COL_DELETED_AT, obj.getLong("deletedAt"));
                } else {
                    cv.putNull(COL_DELETED_AT);
                }

                cv.put(COL_IS_ROUTINE, obj.optBoolean("isRoutine", false) ? 1 : 0);

                if (obj.has("lastCompletedDate") && !obj.isNull("lastCompletedDate")) {
                    cv.put(COL_LAST_COMPLETED_DATE, obj.getString("lastCompletedDate"));
                } else {
                    cv.putNull(COL_LAST_COMPLETED_DATE);
                }

                db.insertWithOnConflict(TABLE_TODOS, null, cv, SQLiteDatabase.CONFLICT_REPLACE);
            }
            db.setTransactionSuccessful();
        } catch (Exception e) {
            Log.e(TAG, "insertOrUpdateTodos transaction failed", e);
        } finally {
            db.endTransaction();
        }
    }

    /**
     * 单条任务完成状态切换
     */
    public synchronized void setTodoCompleted(String id, boolean completed, long completedAt) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put(COL_COMPLETED, completed ? 1 : 0);
        if (completed) {
            cv.put(COL_COMPLETED_AT, completedAt);
            String todayKey = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date(completedAt));
            cv.put(COL_LAST_COMPLETED_DATE, todayKey);
        } else {
            cv.putNull(COL_COMPLETED_AT);
            cv.putNull(COL_LAST_COMPLETED_DATE);
        }
        cv.put(COL_UPDATED_AT, System.currentTimeMillis());
        db.update(TABLE_TODOS, cv, COL_ID + " = ?", new String[]{id});
    }

    /**
     * 单条任务软删除
     */
    public synchronized void softDeleteTodo(String id, long deletedAt) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put(COL_DELETED_AT, deletedAt);
        cv.put(COL_UPDATED_AT, System.currentTimeMillis());
        db.update(TABLE_TODOS, cv, COL_ID + " = ?", new String[]{id});
    }

    /**
     * 每日凌晨 0:00 零点重置已完成的日常习惯事项
     */
    public synchronized int resetDailyRoutinesForMidnight(long todayStart) {
        String todayKey = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date(todayStart));
        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put(COL_COMPLETED, 0);
        cv.putNull(COL_COMPLETED_AT);
        cv.put(COL_UPDATED_AT, System.currentTimeMillis());

        // 重置所有在今天之前已完成的每日必做事项
        int resetCount = db.update(TABLE_TODOS, cv,
                COL_DELETED_AT + " IS NULL AND " + COL_IS_ROUTINE + " = 1 AND " + COL_COMPLETED + " = 1 AND ("
                        + COL_LAST_COMPLETED_DATE + " IS NULL OR " + COL_LAST_COMPLETED_DATE + " < ?)",
                new String[]{todayKey});
        Log.i(TAG, "resetDailyRoutinesForMidnight: reset " + resetCount + " routines for todayKey=" + todayKey);
        return resetCount;
    }

    /**
     * 供小组件使用的今日待办任务数据结构
     */
    public static class WidgetTodoItem {
        public String id;
        public String text;
        public long dueAt;
        public String location;
        public boolean isRoutine;
    }

    /**
     * 小组件直接查询：今天未完成的任务（含每日必做），按时间升序
     */
    public synchronized List<WidgetTodoItem> getTodayActiveTodosForWidget(long todayStart, long todayEnd, java.util.Set<String> completingIds) {
        List<WidgetTodoItem> result = new ArrayList<>();
        SQLiteDatabase db = getReadableDatabase();
        Cursor cursor = null;
        try {
            // 查询未删除的任务
            String selection = COL_DELETED_AT + " IS NULL";
            cursor = db.query(TABLE_TODOS, null, selection, null, null, null, null);

            while (cursor.moveToNext()) {
                String id = cursor.getString(cursor.getColumnIndexOrThrow(COL_ID));
                boolean completed = cursor.getInt(cursor.getColumnIndexOrThrow(COL_COMPLETED)) == 1;
                boolean isRoutine = cursor.getInt(cursor.getColumnIndexOrThrow(COL_IS_ROUTINE)) == 1;

                // 已完成任务仅在动效期间显示
                if (completed && (completingIds == null || !completingIds.contains(id))) {
                    continue;
                }

                String dueAtStr = cursor.getString(cursor.getColumnIndexOrThrow(COL_DUE_AT));
                long dueAt = parseDueAtStr(dueAtStr);

                // 筛选条件：
                // 1) 设定了今天的时间 (todayStart <= dueAt < todayEnd)
                // 2) 或者是每日必做习惯 (isRoutine = 1，不论有无设定具体小时，均属于今日必做)
                boolean isToday = (dueAt >= todayStart && dueAt < todayEnd);
                if (!isToday && !isRoutine) {
                    continue;
                }

                WidgetTodoItem item = new WidgetTodoItem();
                item.id = id;
                item.text = cursor.getString(cursor.getColumnIndexOrThrow(COL_TEXT));
                item.dueAt = dueAt;
                item.location = cursor.getString(cursor.getColumnIndexOrThrow(COL_LOCATION));
                item.isRoutine = isRoutine;
                result.add(item);
            }
        } catch (Exception e) {
            Log.e(TAG, "getTodayActiveTodosForWidget failed", e);
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }

        // 排序规则：按时间升序；未设具体时间的排在前面或后面
        Collections.sort(result, new Comparator<WidgetTodoItem>() {
            @Override
            public int compare(WidgetTodoItem a, WidgetTodoItem b) {
                // 如果都有时间，按时间升序
                if (a.dueAt > 0 && b.dueAt > 0) {
                    return Long.compare(a.dueAt, b.dueAt);
                }
                // 无时间的排在有时间的上方，或者下方：按 a.dueAt > 0 排序
                return Long.compare(a.dueAt, b.dueAt);
            }
        });

        return result;
    }

    private static long parseDueAtStr(String str) {
        if (str == null || str.isEmpty() || "null".equals(str)) return 0;
        try {
            SimpleDateFormat sdf;
            if (str.split(":").length == 2) {
                sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm", Locale.getDefault());
            } else {
                sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault());
            }
            Date date = sdf.parse(str);
            if (date != null) return date.getTime();
        } catch (Exception ignored) {
        }
        try {
            return Long.parseLong(str);
        } catch (Exception ignored) {
        }
        return 0;
    }
}
