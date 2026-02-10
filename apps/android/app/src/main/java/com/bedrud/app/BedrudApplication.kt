package com.bedrud.app

import android.app.Application
import com.bedrud.app.core.di.appModule
import com.bedrud.app.core.instance.InstanceStore
import com.bedrud.app.core.instance.MigrationHelper
import org.koin.android.ext.android.inject
import org.koin.android.ext.koin.androidContext
import org.koin.android.ext.koin.androidLogger
import org.koin.core.context.startKoin
import org.koin.core.logger.Level

class BedrudApplication : Application() {

    override fun onCreate() {
        super.onCreate()

        startKoin {
            androidLogger(Level.DEBUG)
            androidContext(this@BedrudApplication)
            modules(appModule)
        }

        // Migrate old single-instance data if present
        val store: InstanceStore by inject()
        MigrationHelper.migrateIfNeeded(this, store)
    }
}
