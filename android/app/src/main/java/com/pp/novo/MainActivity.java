package com.pp.novo;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // PP: plugin que troca o ícone do app conforme a cor escolhida
        registerPlugin(PPIconPlugin.class);
        super.onCreate(savedInstanceState);
        // PP: o vídeo começa a tocar sozinho ao abrir (por padrão o Android exige um toque na tela antes)
        getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
    }

    @Override
    public void onStop() {
        super.onStop();
        // PP: troca o ícone (se a cor mudou) quando a pessoa sai do app
        PPIconPlugin.applyPendingIcon(this);
    }
}
