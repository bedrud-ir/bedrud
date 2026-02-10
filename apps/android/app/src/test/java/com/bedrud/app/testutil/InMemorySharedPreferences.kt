package com.bedrud.app.testutil

import android.content.SharedPreferences
import java.util.concurrent.ConcurrentHashMap

class InMemorySharedPreferences : SharedPreferences {

    private val data = ConcurrentHashMap<String, Any?>()
    private val listeners = mutableListOf<SharedPreferences.OnSharedPreferenceChangeListener>()

    override fun getAll(): MutableMap<String, *> = HashMap(data)

    override fun getString(key: String?, defValue: String?): String? {
        return if (data.containsKey(key)) data[key] as? String else defValue
    }

    @Suppress("UNCHECKED_CAST")
    override fun getStringSet(key: String?, defValues: MutableSet<String>?): MutableSet<String>? {
        return if (data.containsKey(key)) (data[key] as? Set<String>)?.toMutableSet() else defValues
    }

    override fun getInt(key: String?, defValue: Int): Int {
        return if (data.containsKey(key)) data[key] as? Int ?: defValue else defValue
    }

    override fun getLong(key: String?, defValue: Long): Long {
        return if (data.containsKey(key)) data[key] as? Long ?: defValue else defValue
    }

    override fun getFloat(key: String?, defValue: Float): Float {
        return if (data.containsKey(key)) data[key] as? Float ?: defValue else defValue
    }

    override fun getBoolean(key: String?, defValue: Boolean): Boolean {
        return if (data.containsKey(key)) data[key] as? Boolean ?: defValue else defValue
    }

    override fun contains(key: String?): Boolean = data.containsKey(key)

    override fun edit(): SharedPreferences.Editor = Editor()

    override fun registerOnSharedPreferenceChangeListener(
        listener: SharedPreferences.OnSharedPreferenceChangeListener?
    ) {
        listener?.let { listeners.add(it) }
    }

    override fun unregisterOnSharedPreferenceChangeListener(
        listener: SharedPreferences.OnSharedPreferenceChangeListener?
    ) {
        listeners.remove(listener)
    }

    private inner class Editor : SharedPreferences.Editor {
        private val pending = HashMap<String, Any?>()
        private val removals = mutableSetOf<String>()
        private var clear = false

        override fun putString(key: String?, value: String?): SharedPreferences.Editor {
            key?.let { pending[it] = value }
            return this
        }

        override fun putStringSet(key: String?, values: MutableSet<String>?): SharedPreferences.Editor {
            key?.let { pending[it] = values?.toSet() }
            return this
        }

        override fun putInt(key: String?, value: Int): SharedPreferences.Editor {
            key?.let { pending[it] = value }
            return this
        }

        override fun putLong(key: String?, value: Long): SharedPreferences.Editor {
            key?.let { pending[it] = value }
            return this
        }

        override fun putFloat(key: String?, value: Float): SharedPreferences.Editor {
            key?.let { pending[it] = value }
            return this
        }

        override fun putBoolean(key: String?, value: Boolean): SharedPreferences.Editor {
            key?.let { pending[it] = value }
            return this
        }

        override fun remove(key: String?): SharedPreferences.Editor {
            key?.let { removals.add(it) }
            return this
        }

        override fun clear(): SharedPreferences.Editor {
            clear = true
            return this
        }

        override fun commit(): Boolean {
            applyChanges()
            return true
        }

        override fun apply() {
            applyChanges()
        }

        private fun applyChanges() {
            if (clear) data.clear()
            removals.forEach { data.remove(it) }
            pending.forEach { (k, v) ->
                if (v == null) data.remove(k) else data[k] = v
            }
        }
    }
}
