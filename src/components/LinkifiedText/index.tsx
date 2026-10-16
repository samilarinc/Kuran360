import React from 'react';
import { Text, Linking, StyleProp, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

// http(s) URLs and bare www. addresses; trailing punctuation is left out of the link
const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<>"]+[^\s<>".,;:!?)\]'])/gi;

interface LinkifiedTextProps {
    children: string;
    style?: StyleProp<TextStyle>;
    selectable?: boolean;
}

/** Plain text in which URLs become tappable links that open in the browser */
export const LinkifiedText: React.FC<LinkifiedTextProps> = ({ children, style, selectable }) => {
    const { theme } = useTheme();
    // split() with a capture group keeps the URLs at the odd indexes
    const parts = children.split(URL_PATTERN);

    return (
        <Text style={style} selectable={selectable}>
            {parts.map((part, i) => {
                if (i % 2 === 0) return part;
                const url = /^www\./i.test(part) ? `https://${part}` : part;
                return (
                    <Text
                        key={i}
                        style={[styles.link, { color: theme.primary }]}
                        onPress={() => Linking.openURL(url).catch(() => { })}
                        accessibilityRole="link"
                    >
                        {part}
                    </Text>
                );
            })}
        </Text>
    );
};

const styles = StyleSheet.create({
    link: {
        textDecorationLine: 'underline',
    },
});
