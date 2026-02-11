package com.bedrud.app.core.di

import com.bedrud.app.core.instance.InstanceManager
import com.bedrud.app.core.instance.InstanceStore
import com.bedrud.app.core.pip.PipStateHolder
import com.bedrud.app.ui.screens.settings.SettingsStore
import org.koin.android.ext.koin.androidApplication
import org.koin.android.ext.koin.androidContext
import org.koin.dsl.module

val appModule = module {
    single { InstanceStore(androidContext()) }
    single { InstanceManager(androidApplication(), get()) }
    single { SettingsStore(androidContext()) }
    single { PipStateHolder() }
}
