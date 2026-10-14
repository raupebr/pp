package com.pp.novo;

import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

// PP: troca o ícone do app na tela inicial para a cor escolhida em Configurações > Aparência.
// Cada cor é um "atalho" do app (activity-alias no AndroidManifest.xml) com o seu ícone; só um fica ligado.
// A troca é feita quando a pessoa sai do app (MainActivity.onStop), para não fechar a tela aberta.
@CapacitorPlugin(name = "PPIcon")
public class PPIconPlugin extends Plugin {
    // Os mesmos ids de src/common/ppPresets.js
    static final List<String> ICONS = Arrays.asList("azul", "esmeralda", "violeta", "rosa", "coral", "ambar", "ciano", "grafite");
    static final String DEFAULT_ICON = "azul";
    private static final String PREFS = "pp-icon";
    private static final String KEY_PENDING = "pending";
    private static final String KEY_CURRENT = "current";

    @PluginMethod
    public void setIcon(PluginCall call) {
        String id = call.getString("id");
        if (id == null || !ICONS.contains(id)) {
            call.reject("Ícone desconhecido: " + id);
            return;
        }

        prefs(getContext()).edit().putString(KEY_PENDING, id).apply();
        call.resolve();
    }

    static void applyPendingIcon(Context context) {
        SharedPreferences prefs = prefs(context);
        String pending = prefs.getString(KEY_PENDING, null);
        String current = prefs.getString(KEY_CURRENT, DEFAULT_ICON);
        if (pending == null || pending.equals(current)) {
            return;
        }

        PackageManager packageManager = context.getPackageManager();
        // Liga primeiro o novo e depois desliga os outros, para o app nunca ficar sem ícone
        packageManager.setComponentEnabledSetting(
            alias(context, pending),
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
            PackageManager.DONT_KILL_APP
        );
        for (String id : ICONS) {
            if (!id.equals(pending)) {
                packageManager.setComponentEnabledSetting(
                    alias(context, id),
                    PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                    PackageManager.DONT_KILL_APP
                );
            }
        }
        prefs.edit().putString(KEY_CURRENT, pending).remove(KEY_PENDING).apply();
    }

    private static ComponentName alias(Context context, String id) {
        String name = "Icon" + id.substring(0, 1).toUpperCase(Locale.ROOT) + id.substring(1);
        return new ComponentName(context.getPackageName(), context.getPackageName() + "." + name);
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}
