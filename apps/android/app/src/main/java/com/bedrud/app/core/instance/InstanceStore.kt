package com.bedrud.app.core.instance

import android.content.Context
import android.content.SharedPreferences
import com.bedrud.app.models.Instance
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class InstanceStore(private val prefs: SharedPreferences) {

    constructor(context: Context) : this(
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    )
    private val gson = Gson()

    private val _instances = MutableStateFlow(loadInstances())
    val instances: StateFlow<List<Instance>> = _instances.asStateFlow()

    private val _activeInstanceId = MutableStateFlow(prefs.getString(KEY_ACTIVE_ID, null))
    val activeInstanceId: StateFlow<String?> = _activeInstanceId.asStateFlow()

    val activeInstance: Instance?
        get() = _instances.value.firstOrNull { it.id == _activeInstanceId.value }

    fun addInstance(instance: Instance) {
        val updated = _instances.value + instance
        _instances.value = updated
        saveInstances(updated)
        if (updated.size == 1) {
            setActive(instance.id)
        }
    }

    fun removeInstance(id: String) {
        val updated = _instances.value.filter { it.id != id }
        _instances.value = updated
        saveInstances(updated)
        if (_activeInstanceId.value == id) {
            val newActive = updated.firstOrNull()?.id
            _activeInstanceId.value = newActive
            prefs.edit().putString(KEY_ACTIVE_ID, newActive).apply()
        }
    }

    fun setActive(id: String) {
        if (_instances.value.any { it.id == id }) {
            _activeInstanceId.value = id
            prefs.edit().putString(KEY_ACTIVE_ID, id).apply()
        }
    }

    private fun saveInstances(instances: List<Instance>) {
        val json = gson.toJson(instances)
        prefs.edit().putString(KEY_INSTANCES, json).apply()
    }

    private fun loadInstances(): List<Instance> {
        val json = prefs.getString(KEY_INSTANCES, null) ?: return emptyList()
        return try {
            val type = object : TypeToken<List<Instance>>() {}.type
            gson.fromJson(json, type)
        } catch (e: Exception) {
            emptyList()
        }
    }

    companion object {
        private const val PREFS_NAME = "bedrud_instances"
        private const val KEY_INSTANCES = "instances"
        private const val KEY_ACTIVE_ID = "active_instance_id"
    }
}
