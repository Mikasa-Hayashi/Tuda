import { getQuizQuestions } from '@/src/data/quiz';
import { headerStyles } from '@/src/theme/headerStyles';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeContext';

const QuizHeader = ({ onBack, title, colors, t }: { onBack(): void; title: string; colors: any; t: any }) => (
  <SafeAreaView edges={['top']} style={[headerStyles.headerContainer, { backgroundColor: colors.background }]}>
    <View style={headerStyles.headerContent}>
      <TouchableOpacity onPress={onBack} style={headerStyles.iconButton}>
        <Ionicons name="close" size={28} color={colors.text} />
      </TouchableOpacity>

      <Text style={[headerStyles.headerTitle, { color: colors.text, fontSize: 18, fontWeight: 'bold' }]}>
        {title}
      </Text>

      {/* Пустая вьюшка справа для баланса, так как настройки в квизе обычно не нужны */}
      <View style={{ width: 40 }} />
    </View>
  </SafeAreaView>
);

export default function QuizScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { id, name } = useLocalSearchParams<{ id: string, name: string }>();
  const quizQuestions = id ? getQuizQuestions({ monumentId: id, lang: i18n.language, t }) : [];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;
  const quizTitle = name || t('quiz.title');

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    if (selectedOption === null || !currentQuestion) return;

    if (selectedOption === currentQuestion.correctIndex) {
      setScore(prev => prev + 1);
    }

    if (isLastQuestion) {
      setIsFinished(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null); // Сбрасываем выбор для следующего вопроса
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
  };

  if (!id) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (quizQuestions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <QuizHeader onBack={handleBack} title={quizTitle} colors={colors} t={t} />
        <View style={[styles.emptyState, { padding: 20 }]}>
          <Ionicons name="alert-circle-outline" size={72} color={colors.primary} />
          <Text style={[styles.resultTitle, { color: colors.text }]}>{t('quiz.unavailableTitle')}</Text>
          <Text style={[styles.resultText, { color: colors.textMuted, textAlign: 'center' }]}>
            {t('quiz.unavailableText')}
          </Text>
          <TouchableOpacity style={[styles.nextButton, { backgroundColor: colors.primary, marginTop: 32, width: '100%' }]} onPress={handleBack}>
            <Text style={styles.nextButtonText}>{t('quiz.backToMonument')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isFinished) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="trophy" size={80} color={colors.primary} style={{ marginBottom: 20 }} />
        <Text style={[styles.resultTitle, { color: colors.text }]}>{t('quiz.completedTitle')}</Text>
        <Text style={[styles.resultText, { color: colors.textMuted }]}>
          {t('quiz.score', { score, total: quizQuestions.length })}
        </Text>

        <TouchableOpacity style={[styles.nextButton, { backgroundColor: colors.primary, marginTop: 40, width: '100%' }]} onPress={handleBack}>
          <Text style={styles.nextButtonText}>{t('quiz.backToMonument')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 20 }} onPress={restartQuiz}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>{t('quiz.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <QuizHeader onBack={handleBack} title={quizTitle} colors={colors} t={t} />

      <View style={styles.content}>
        <Text style={[styles.progressText, { color: colors.textMuted }]}>
          {t('quiz.progress', { current: currentQuestionIndex + 1, total: quizQuestions.length })}
        </Text>

        <View style={styles.progressBarBg}>
          <View style={[
            styles.progressBarFill, 
            { backgroundColor: colors.primary, width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }
          ]} />
        </View>

        <Text style={[styles.questionText, { color: colors.text }]}>
          {currentQuestion.question}
        </Text>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === index;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  { borderColor: colors.border },
                  isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => setSelectedOption(index)}
              >
                <View style={[
                  styles.radioCircle,
                  { borderColor: colors.textMuted },
                  isSelected && { borderColor: colors.primary, backgroundColor: colors.primary }
                ]}>
                  {isSelected && <View style={styles.innerRadio} />}
                </View>
                <Text style={[styles.optionText, { color: colors.text }]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Кнопка Далее фиксируется внизу */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.nextButton, 
            { backgroundColor: selectedOption !== null ? colors.primary : colors.border }
          ]}
          disabled={selectedOption === null}
          onPress={handleNext}
        >
          <Text style={[
            styles.nextButtonText, 
            { color: selectedOption !== null ? 'black' : colors.textMuted }
          ]}>
            {isLastQuestion ? t('quiz.finish') : t('quiz.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 30,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  questionText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
  },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  innerRadio: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: 'black', // или белый, в зависимости от твоей темы
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  footer: {
    padding: 20,
    paddingBottom: 40, // Отступ для челки на айфонах
    borderTopWidth: 1,
  },
  nextButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Стили экрана результатов
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
});